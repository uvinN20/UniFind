const express = require('express');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');
const { protect } = require('../middleware/auth');

const router = express.Router();

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = str(req.body.name);
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email and password are required');
    }
    if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
    if (await User.findOne({ email })) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      studentId: str(req.body.studentId),
      phone: str(req.body.phone),
    });

    res.status(201).json({ token: signToken(user), user });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) throw new ApiError(400, 'Email and password are required');

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Incorrect email or password');
    }
    if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

    res.json({ token: signToken(user), user });
  })
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

// PUT /api/auth/me - update profile / password
router.put(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');

    if (req.body.name !== undefined) user.name = str(req.body.name);
    if (req.body.studentId !== undefined) user.studentId = str(req.body.studentId);
    if (req.body.phone !== undefined) user.phone = str(req.body.phone);

    if (req.body.newPassword) {
      if (!(await user.comparePassword(String(req.body.currentPassword || '')))) {
        throw new ApiError(400, 'Current password is incorrect');
      }
      user.password = String(req.body.newPassword);
    }

    await user.save();
    res.json({ user });
  })
);

module.exports = router;
