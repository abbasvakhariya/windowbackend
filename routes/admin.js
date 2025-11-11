const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Window = require('../models/Window');
const Settings = require('../models/Settings');
const { protect, isAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.subscriptionStatus = status;
    }

    const users = await User.find(query)
      .select('-password -emailVerificationOTP -loginOTP')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -emailVerificationOTP -loginOTP');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const subscriptions = await Subscription.find({ userId: user._id }).sort({ createdAt: -1 });
    const windowsCount = await Window.countDocuments({ userId: user._id });

    res.json({
      success: true,
      user,
      subscriptions,
      windowsCount
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin)
// @access  Admin
router.put('/users/:id', async (req, res) => {
  try {
    const { subscriptionTier, subscriptionStatus, subscriptionEndDate, isActive } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (subscriptionTier) user.subscriptionTier = subscriptionTier;
    if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;
    if (subscriptionEndDate) user.subscriptionEndDate = new Date(subscriptionEndDate);
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete related data
    await Window.deleteMany({ userId: user._id });
    await Settings.deleteOne({ userId: user._id });
    await Subscription.deleteMany({ userId: user._id });
    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ subscriptionStatus: 'active' });
    const trialUsers = await User.countDocuments({ subscriptionStatus: 'trial' });
    const expiredUsers = await User.countDocuments({ subscriptionStatus: 'expired' });
    const totalWindows = await Window.countDocuments();
    const totalSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // Revenue calculation
    const activeSubscriptions = await Subscription.find({ status: 'active' });
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.price, 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        trialUsers,
        expiredUsers,
        totalWindows,
        totalSubscriptions,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions
// @access  Admin
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('userId', 'email fullName companyName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/users/create
// @desc    Create new user (admin)
// @access  Admin
router.post('/users/create', async (req, res) => {
  try {
    const { email, password, fullName, companyName, phone, subscriptionTier, subscriptionStatus, subscriptionEndDate } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: password || 'TempPassword123!',
      fullName,
      companyName: companyName || '',
      phone: phone || '',
      isEmailVerified: true,
      subscriptionTier: subscriptionTier || 'trial',
      subscriptionStatus: subscriptionStatus || 'trial',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/admin/clear-device/:userId
// @desc    Clear device session for a user (admin only)
// @access  Private/Admin
router.post('/clear-device/:userId', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.currentDevice = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Device session cleared successfully'
    });
  } catch (error) {
    console.error('Clear device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/plans
// @desc    Get all subscription plans
// @access  Admin
router.get('/plans', async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    let plans = await SystemSettings.findOne({ key: 'subscription_plans' });
    
    if (!plans || !plans.value) {
      // Default plans
      const defaultPlans = {
        '1_month': { price: 460, duration: 1, billingCycle: 'monthly', name: '1 Month' },
        '3_months': { price: 1250, duration: 3, billingCycle: 'quarterly', name: '3 Months' },
        '6_months': { price: 2200, duration: 6, billingCycle: 'semi_annual', name: '6 Months' },
        '12_months': { price: 4000, duration: 12, billingCycle: 'annual', name: '12 Months' }
      };
      return res.json({
        success: true,
        plans: defaultPlans
      });
    }

    res.json({
      success: true,
      plans: plans.value
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/plans
// @desc    Update subscription plans
// @access  Admin
router.put('/plans', async (req, res) => {
  try {
    const { plans } = req.body;
    const SystemSettings = require('../models/SystemSettings');
    
    await SystemSettings.findOneAndUpdate(
      { key: 'subscription_plans' },
      { 
        key: 'subscription_plans',
        value: plans,
        type: 'object',
        category: 'subscription',
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Plans updated successfully',
      plans
    });
  } catch (error) {
    console.error('Update plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/notifications/send
// @desc    Send notification to users
// @access  Admin
router.post('/notifications/send', async (req, res) => {
  try {
    const { userIds, title, message, category } = req.body;
    const Notification = require('../models/Notification');
    const { sendOTP } = require('../utils/email');

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    // Create in-app notifications
    const notifications = userIds.map(userId => ({
      userId,
      type: 'in_app',
      title,
      message,
      category: category || 'announcement'
    }));

    await Notification.insertMany(notifications);

    // Send emails to users
    const users = await User.find({ _id: { $in: userIds } }).select('email fullName');
    for (const user of users) {
      try {
        await sendOTP(user.email, message, 'notification', title);
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
      }
    }

    res.json({
      success: true,
      message: `Notification sent to ${userIds.length} user(s)`,
      count: userIds.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

