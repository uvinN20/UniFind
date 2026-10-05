const express = require('express');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// After a claim is rejected or withdrawn, reopen the item if nothing else is pending
const reopenIfNoPending = async (item) => {
  if (item.status !== 'claim_pending') return;
  const pending = await Claim.countDocuments({ item: item._id, status: 'pending' });
  if (pending === 0) {
    item.status = 'open';
    await item.save();
  }
};

// POST /api/claims/item/:itemId - submit a claim on an item
router.post(
  '/item/:itemId',
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.itemId);
    if (!item) throw new ApiError(404, 'Report not found');
    if (String(item.reporter) === String(req.user._id)) {
      throw new ApiError(400, 'You cannot submit a claim on your own report');
    }
    if (['recovered', 'closed'].includes(item.status)) {
      throw new ApiError(400, 'This report is no longer accepting claims');
    }
    if (await Claim.findOne({ item: item._id, claimant: req.user._id, status: 'pending' })) {
      throw new ApiError(409, 'You already have a pending claim on this report');
    }

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user._id,
      message: str(req.body.message),
      proofDetails: str(req.body.proofDetails),
      contactPhone: str(req.body.contactPhone),
    });

    if (item.status === 'open') {
      item.status = 'claim_pending';
      await item.save();
    }

    res.status(201).json({ claim });
  })
);

// GET /api/claims/mine - claims I have submitted
router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const claims = await Claim.find({ claimant: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'item',
        select: 'title type status imageUrl location contactPhone reporter',
        populate: { path: 'reporter', select: 'name email phone' },
      });

    // Reporter contact details are only shared once a claim is approved
    const result = claims.map((c) => {
      const obj = c.toObject();
      if (obj.item) {
        const reporter = obj.item.reporter || {};
        if (obj.status === 'approved') {
          obj.contact = { name: reporter.name, email: reporter.email, phone: obj.item.contactPhone || reporter.phone || '' };
        }
        delete obj.item.reporter;
        delete obj.item.contactPhone;
      }
      return obj;
    });

    res.json({ claims: result });
  })
);

// GET /api/claims/received - claims on reports I created
router.get(
  '/received',
  asyncHandler(async (req, res) => {
    const myItems = await Item.find({ reporter: req.user._id }).select('_id');
    const claims = await Claim.find({ item: { $in: myItems.map((i) => i._id) } })
      .sort({ createdAt: -1 })
      .populate('claimant', 'name email studentId phone')
      .populate('item', 'title type status imageUrl');

    res.json({ claims });
  })
);

// PATCH /api/claims/:id/review - approve or reject (report owner or admin)
router.patch(
  '/:id/review',
  asyncHandler(async (req, res) => {
    const { decision } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      throw new ApiError(400, 'Decision must be approved or rejected');
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new ApiError(404, 'Claim not found');
    const item = await Item.findById(claim.item);
    if (!item) throw new ApiError(404, 'The report for this claim no longer exists');

    const isOwner = String(item.reporter) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      throw new ApiError(403, 'Only the report owner can review this claim');
    }
    if (claim.status !== 'pending') throw new ApiError(400, 'This claim has already been reviewed');

    claim.status = decision;
    claim.reviewNote = str(req.body.note);
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    await claim.save();

    if (decision === 'approved') {
      item.status = 'recovered';
      await item.save();
      await Claim.updateMany(
        { item: item._id, status: 'pending' },
        {
          status: 'rejected',
          reviewNote: 'Another claim was approved for this item',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        }
      );
    } else {
      await reopenIfNoPending(item);
    }

    res.json({ claim });
  })
);

// PATCH /api/claims/:id/withdraw - claimant cancels a pending claim
router.patch(
  '/:id/withdraw',
  asyncHandler(async (req, res) => {
    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new ApiError(404, 'Claim not found');
    if (String(claim.claimant) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only withdraw your own claims');
    }
    if (claim.status !== 'pending') throw new ApiError(400, 'Only pending claims can be withdrawn');

    claim.status = 'withdrawn';
    await claim.save();

    const item = await Item.findById(claim.item);
    if (item) await reopenIfNoPending(item);

    res.json({ claim });
  })
);

module.exports = router;
