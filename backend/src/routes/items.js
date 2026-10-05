const express = require('express');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const upload = require('../middleware/upload');
const { protect, optionalAuth } = require('../middleware/auth');
const { fileUrl, removeUploadedFile } = require('../utils/files');

const { CATEGORIES, STATUSES } = Item;
const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const assertCanManage = (user, item) => {
  const isOwner = String(item.reporter) === String(user._id);
  if (!isOwner && user.role !== 'admin') {
    throw new ApiError(403, 'You can only manage your own reports');
  }
};

// GET /api/items - public search and browse
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, type, category, status } = req.query;
    const filter = {};

    if (['lost', 'found'].includes(type)) filter.type = type;
    if (CATEGORIES.includes(category)) filter.category = category;
    filter.status = STATUSES.includes(status) ? status : { $ne: 'closed' };

    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { location: rx }];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reporter', 'name'),
      Item.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

// GET /api/items/stats/summary - numbers for the home page
router.get(
  '/stats/summary',
  asyncHandler(async (req, res) => {
    const [lost, found, recovered, open] = await Promise.all([
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'recovered' }),
      Item.countDocuments({ status: { $in: ['open', 'claim_pending'] } }),
    ]);
    res.json({ lost, found, recovered, open, total: lost + found });
  })
);

// GET /api/items/mine - the logged in user's reports
router.get(
  '/mine',
  protect,
  asyncHandler(async (req, res) => {
    const items = await Item.find({ reporter: req.user._id }).sort({ createdAt: -1 }).lean();

    const counts = await Claim.aggregate([
      { $match: { item: { $in: items.map((i) => i._id) }, status: 'pending' } },
      { $group: { _id: '$item', n: { $sum: 1 } } },
    ]);
    const byItem = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    res.json({ items: items.map((i) => ({ ...i, pendingClaims: byItem[String(i._id)] || 0 })) });
  })
);

// GET /api/items/:id
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id).populate('reporter', 'name email phone');
    if (!item) throw new ApiError(404, 'Report not found');

    const obj = item.toObject();
    const reporter = obj.reporter || { name: 'Former user' };
    const isOwner = !!(req.user && obj.reporter && String(obj.reporter._id) === String(req.user._id));
    const isAdmin = !!(req.user && req.user.role === 'admin');

    let myClaim = null;
    let canSeeContact = isOwner || isAdmin;

    if (req.user && !isOwner) {
      myClaim = await Claim.findOne({ item: item._id, claimant: req.user._id }).sort({ createdAt: -1 });
      if (myClaim && myClaim.status === 'approved') canSeeContact = true;
    }

    if (canSeeContact) {
      obj.contact = { email: reporter.email, phone: obj.contactPhone || reporter.phone || '' };
    } else {
      delete obj.contactPhone;
    }
    obj.reporter = { _id: reporter._id, name: reporter.name };

    res.json({ item: obj, myClaim, isOwner });
  })
);

// POST /api/items - report a lost or found item (multipart, optional "image")
router.post(
  '/',
  protect,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const imageUrl = fileUrl(req.file);
    try {
      const { type, title, description, category, location, dateOccurred, contactPhone } = req.body;
      const item = await Item.create({
        type,
        title,
        description,
        category: category || 'Other',
        location,
        dateOccurred,
        contactPhone,
        imageUrl,
        reporter: req.user._id,
      });
      res.status(201).json({ item });
    } catch (err) {
      removeUploadedFile(imageUrl);
      throw err;
    }
  })
);

// PUT /api/items/:id - edit a report (owner or admin)
router.put(
  '/:id',
  protect,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const newUrl = fileUrl(req.file);
    try {
      const item = await Item.findById(req.params.id);
      if (!item) throw new ApiError(404, 'Report not found');
      assertCanManage(req.user, item);

      ['title', 'description', 'category', 'location', 'dateOccurred', 'contactPhone'].forEach((k) => {
        if (req.body[k] !== undefined) item[k] = req.body[k];
      });

      const oldUrl = item.imageUrl;
      if (newUrl) item.imageUrl = newUrl;
      else if (req.body.removeImage === 'true') item.imageUrl = '';

      await item.save();
      if (oldUrl && oldUrl !== item.imageUrl) removeUploadedFile(oldUrl);

      res.json({ item });
    } catch (err) {
      removeUploadedFile(newUrl);
      throw err;
    }
  })
);

// PATCH /api/items/:id/status - open, close, or mark as recovered (owner or admin)
router.patch(
  '/:id/status',
  protect,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['open', 'closed', 'recovered'].includes(status)) {
      throw new ApiError(400, 'Status must be open, closed or recovered');
    }

    const item = await Item.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Report not found');
    assertCanManage(req.user, item);

    if (status === 'open') {
      const pending = await Claim.countDocuments({ item: item._id, status: 'pending' });
      item.status = pending > 0 ? 'claim_pending' : 'open';
    } else {
      item.status = status;
      await Claim.updateMany(
        { item: item._id, status: 'pending' },
        {
          status: 'rejected',
          reviewNote: status === 'recovered' ? 'The item was recovered' : 'The report was closed',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        }
      );
    }

    await item.save();
    res.json({ item });
  })
);

// DELETE /api/items/:id (owner or admin)
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Report not found');
    assertCanManage(req.user, item);

    await Claim.deleteMany({ item: item._id });
    await item.deleteOne();
    removeUploadedFile(item.imageUrl);

    res.json({ message: 'Report deleted' });
  })
);

module.exports = router;
