const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, checkDevice } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, checkDevice, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, checkDevice, async (req, res) => {
  try {
    const { fullName, companyName, phone } = req.body;

    const user = await User.findById(req.user._id);
    
    if (fullName) user.fullName = fullName;
    if (companyName !== undefined) user.companyName = companyName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

