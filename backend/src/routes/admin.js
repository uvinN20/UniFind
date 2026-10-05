const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { protect, adminOnly } = require('../middleware/auth');
const { removeUploadedFile } = require('../utils/files');

const router = express.Router();
router.use(protect, adminOnly);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/stats
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [users, lost, found, open, recovered, pendingClaims, totalClaims] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: { $in: ['open', 'claim_pending'] } }),
      Item.countDocuments({ status: 'recovered' }),
      Claim.countDocuments({ status: 'pending' }),
      Claim.countDocuments(),
    ]);
    res.json({ users, lost, found, open, recovered, pendingClaims, totalClaims });
  })
);

// GET /api/admin/users?q=
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { studentId: rx }];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ users });
  })
);

// PATCH /api/admin/users/:id - change role or activate / deactivate
router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id)) {
      throw new ApiError(400, 'You cannot change your own role or status');
    }
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    if (req.body.role !== undefined) {
      if (!['student', 'admin'].includes(req.body.role)) throw new ApiError(400, 'Invalid role');
      user.role = req.body.role;
    }
    if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;

    await user.save();
    res.json({ user });
  })
);

// DELETE /api/admin/users/:id - removes the user and everything they created
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id)) {
      throw new ApiError(400, 'You cannot delete your own account');
    }
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    const items = await Item.find({ reporter: user._id });
    const itemIds = items.map((i) => i._id);

    await Claim.deleteMany({ $or: [{ claimant: user._id }, { item: { $in: itemIds } }] });
    await Item.deleteMany({ reporter: user._id });
    items.forEach((i) => removeUploadedFile(i.imageUrl));
    await user.deleteOne();

    res.json({ message: 'User and related data deleted' });
  })
);

// GET /api/admin/items?q=&type=&status=&page=
router.get(
  '/items',
  asyncHandler(async (req, res) => {
    const { q, type, status } = req.query;
    const filter = {};
    if (['lost', 'found'].includes(type)) filter.type = type;
    if (Item.STATUSES.includes(status)) filter.status = status;
    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { location: rx }];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 20;
    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reporter', 'name email'),
      Item.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

// GET /api/admin/claims?status=
router.get(
  '/claims',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (['pending', 'approved', 'rejected', 'withdrawn'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const claims = await Claim.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('claimant', 'name email studentId')
      .populate({ path: 'item', select: 'title type status reporter', populate: { path: 'reporter', select: 'name' } });

    res.json({ claims });
  })
);

module.exports = router;
