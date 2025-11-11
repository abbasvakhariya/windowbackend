const express = require('express');
const router = express.Router();
const Window = require('../models/Window');
const { protect, checkDevice } = require('../middleware/auth');

// @route   GET /api/windows
// @desc    Get all windows for user
// @access  Private
router.get('/', protect, checkDevice, async (req, res) => {
  try {
    const windows = await Window.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: windows.length,
      windows
    });
  } catch (error) {
    console.error('Get windows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/windows
// @desc    Create a new window
// @access  Private
router.post('/', protect, checkDevice, async (req, res) => {
  try {
    const windowData = {
      ...req.body,
      userId: req.user._id
    };

    const window = await Window.create(windowData);

    res.status(201).json({
      success: true,
      message: 'Window created successfully',
      window
    });
  } catch (error) {
    console.error('Create window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/windows/:id
// @desc    Update a window
// @access  Private
router.put('/:id', protect, checkDevice, async (req, res) => {
  try {
    const window = await Window.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!window) {
      return res.status(404).json({
        success: false,
        message: 'Window not found'
      });
    }

    Object.assign(window, req.body);
    await window.save();

    res.json({
      success: true,
      message: 'Window updated successfully',
      window
    });
  } catch (error) {
    console.error('Update window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/windows/:id
// @desc    Delete a window
// @access  Private
router.delete('/:id', protect, checkDevice, async (req, res) => {
  try {
    const window = await Window.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!window) {
      return res.status(404).json({
        success: false,
        message: 'Window not found'
      });
    }

    await window.deleteOne();

    res.json({
      success: true,
      message: 'Window deleted successfully'
    });
  } catch (error) {
    console.error('Delete window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

