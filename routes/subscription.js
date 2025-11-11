const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { protect, checkDevice } = require('../middleware/auth');

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Get plans from database or return defaults
const getPlans = async () => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const plansSetting = await SystemSettings.findOne({ key: 'subscription_plans' });
    
    if (plansSetting && plansSetting.value) {
      return plansSetting.value;
    }
    
    // Default plans
    return {
      '1_month': { price: 460, duration: 1, billingCycle: 'monthly', name: '1 Month' },
      '3_months': { price: 1250, duration: 3, billingCycle: 'quarterly', name: '3 Months' },
      '6_months': { price: 2200, duration: 6, billingCycle: 'semi_annual', name: '6 Months' },
      '12_months': { price: 4000, duration: 12, billingCycle: 'annual', name: '12 Months' }
    };
  } catch (error) {
    console.error('Error getting plans:', error);
    return {
      '1_month': { price: 460, duration: 1, billingCycle: 'monthly', name: '1 Month' },
      '3_months': { price: 1250, duration: 3, billingCycle: 'quarterly', name: '3 Months' },
      '6_months': { price: 2200, duration: 6, billingCycle: 'semi_annual', name: '6 Months' },
      '12_months': { price: 4000, duration: 12, billingCycle: 'annual', name: '12 Months' }
    };
  }
};

// @route   GET /api/subscription/plans
// @desc    Get available subscription plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = await getPlans();
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching plans'
    });
  }
});

// @route   GET /api/subscription/current
// @desc    Get current subscription
// @access  Private
router.get('/current', protect, checkDevice, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      subscription: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate
      },
      activeSubscription: subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/subscription/create-payment
// @desc    Create PayPal payment
// @access  Private
router.post('/create-payment', protect, checkDevice, async (req, res) => {
  try {
    const { planType } = req.body;
    const PLANS = await getPlans();

    if (!PLANS[planType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type'
      });
    }

    const plan = PLANS[planType];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    // Create PayPal payment
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.FRONTEND_URL}/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: `${planType.replace('_', ' ')} Subscription`,
            sku: planType,
            price: plan.price.toString(),
            currency: 'INR',
            quantity: 1
          }]
        },
        amount: {
          currency: 'INR',
          total: plan.price.toString()
        },
        description: `Window Management System - ${planType} subscription`
      }]
    };

    paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal error:', error);
        return res.status(500).json({
          success: false,
          message: 'Payment creation failed'
        });
      }

      // Create subscription record
      const subscription = await Subscription.create({
        userId: req.user._id,
        planType,
        status: 'pending',
        startDate,
        endDate,
        price: plan.price,
        currency: 'INR',
        billingCycle: plan.billingCycle,
        paypalOrderId: payment.id
      });

      // Find approval URL
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url');

      res.json({
        success: true,
        paymentId: payment.id,
        approvalUrl: approvalUrl.href,
        subscriptionId: subscription._id
      });
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/subscription/execute-payment
// @desc    Execute PayPal payment
// @access  Private
router.post('/execute-payment', protect, checkDevice, async (req, res) => {
  try {
    const { paymentId, payerId, subscriptionId } = req.body;

    const execute_payment_json = {
      payer_id: payerId
    };

    paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal execution error:', error);
        return res.status(500).json({
          success: false,
          message: 'Payment execution failed'
        });
      }

      if (payment.state === 'approved') {
        // Update subscription
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
          return res.status(404).json({
            success: false,
            message: 'Subscription not found'
          });
        }

        subscription.status = 'active';
        subscription.paypalPaymentId = paymentId;
        subscription.transactionId = payment.transactions[0].related_resources[0].sale.id;
        await subscription.save();

        // Update user subscription
        const user = await User.findById(req.user._id);
        user.subscriptionTier = subscription.planType;
        user.subscriptionStatus = 'active';
        user.subscriptionStartDate = subscription.startDate;
        user.subscriptionEndDate = subscription.endDate;
        await user.save();

        res.json({
          success: true,
          message: 'Payment successful',
          subscription: {
            tier: user.subscriptionTier,
            status: user.subscriptionStatus,
            endDate: user.subscriptionEndDate
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment not approved'
        });
      }
    });
  } catch (error) {
    console.error('Execute payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/subscription/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', protect, checkDevice, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active'
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    const user = await User.findById(req.user._id);
    user.subscriptionStatus = 'cancelled';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

