const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Window = require('../models/Window');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');
const SystemSettings = require('../models/SystemSettings');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const AuditLog = require('../models/AuditLog');
const { protect, isAdmin } = require('../middleware/auth');
const { sendOTP } = require('../utils/email');

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// Helper to create audit log
const createAuditLog = async (adminId, action, resource, resourceId, changes, req) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      resource,
      resourceId,
      changes,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// ==================== ENHANCED USER MANAGEMENT ====================

// Bulk user operations
router.post('/users/bulk', async (req, res) => {
  try {
    const { userIds, action, data } = req.body;
    const results = { success: [], failed: [] };

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }

        switch (action) {
          case 'activate':
            user.isActive = true;
            break;
          case 'deactivate':
            user.isActive = false;
            break;
          case 'delete':
            await Window.deleteMany({ userId });
            await Subscription.deleteMany({ userId });
            await user.deleteOne();
            break;
          case 'update':
            Object.assign(user, data);
            await user.save();
            break;
        }

        if (action !== 'delete') await user.save();
        results.success.push(userId);
        await createAuditLog(req.user._id, `bulk_${action}`, 'user', userId, data, req);
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User activity logs
router.get('/users/:id/activity', async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User notes
router.post('/users/:id/notes', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (!user.notes) user.notes = [];
    user.notes.push({
      note: req.body.note,
      createdBy: req.user._id,
      createdAt: new Date()
    });
    await user.save();
    await createAuditLog(req.user._id, 'add_note', 'user', req.params.id, { note: req.body.note }, req);
    res.json({ success: true, message: 'Note added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PAYMENT & BILLING ====================

router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('userId', 'email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);
    const totalRevenue = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      payments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payments/:id/refund', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = 'refunded';
    payment.notes = req.body.notes || payment.notes;
    await payment.save();

    await createAuditLog(req.user._id, 'refund_payment', 'payment', req.params.id, { amount: payment.amount }, req);
    res.json({ success: true, message: 'Payment refunded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ANALYTICS & REPORTS ====================

router.get('/analytics/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // User growth
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by date
    const revenueByDate = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Subscription distribution
    const subscriptionDistribution = await User.aggregate([
      { $group: { _id: '$subscriptionTier', count: { $sum: 1 } } }
    ]);

    // Conversion rates
    const totalTrials = await User.countDocuments({ subscriptionStatus: 'trial' });
    const totalPaid = await User.countDocuments({ subscriptionStatus: 'active', subscriptionTier: { $ne: 'trial' } });
    const conversionRate = totalTrials > 0 ? (totalPaid / totalTrials) * 100 : 0;

    res.json({
      success: true,
      analytics: {
        userGrowth,
        revenueByDate,
        subscriptionDistribution,
        conversionRate: conversionRate.toFixed(2),
        totalTrials,
        totalPaid
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SYSTEM SETTINGS ====================

router.get('/settings', async (req, res) => {
  try {
    const settings = await SystemSettings.find().sort({ category: 1, key: 1 });
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) acc[setting.category] = [];
      acc[setting.category].push(setting);
      return acc;
    }, {});
    res.json({ success: true, settings: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const setting = await SystemSettings.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await createAuditLog(req.user._id, 'update_setting', 'settings', req.params.key, { value: req.body.value }, req);
    res.json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== NOTIFICATIONS ====================

router.post('/notifications/send', async (req, res) => {
  try {
    const { userIds, title, message, category } = req.body;
    const notifications = userIds.map(userId => ({
      userId,
      type: 'in_app',
      title,
      message,
      category: category || 'announcement'
    }));

    await Notification.insertMany(notifications);
    await createAuditLog(req.user._id, 'send_notification', 'notification', null, { count: notifications.length }, req);
    res.json({ success: true, message: 'Notifications sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SUPPORT TICKETS ====================

router.get('/support/tickets', async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'email fullName')
      .populate('assignedTo', 'email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);
    res.json({ success: true, tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/support/tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await createAuditLog(req.user._id, 'update_ticket', 'support', req.params.id, req.body, req);
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== AUDIT LOGS ====================

router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, adminId, resource } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (adminId) query.adminId = adminId;
    if (resource) query.resource = resource;

    const logs = await AuditLog.find(query)
      .populate('adminId', 'email fullName')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);
    res.json({ success: true, logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DATA EXPORT ====================

router.get('/export/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -emailVerificationOTP -loginOTP');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/export/payments', async (req, res) => {
  try {
    const payments = await Payment.find().populate('userId', 'email fullName');
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

