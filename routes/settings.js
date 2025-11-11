const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, checkDevice } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', protect, checkDevice, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      // Create default settings
      settings = await Settings.create({ userId: req.user._id });
    }

    res.json({
      success: true,
      settings: settings.toolSettings,
      preferences: settings.preferences
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put('/', protect, checkDevice, async (req, res) => {
  try {
    const { toolSettings, preferences } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = await Settings.create({ userId: req.user._id });
    }

    if (toolSettings) {
      settings.toolSettings = toolSettings;
    }

    if (preferences) {
      settings.preferences = { ...settings.preferences, ...preferences };
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: settings.toolSettings,
      preferences: settings.preferences
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

