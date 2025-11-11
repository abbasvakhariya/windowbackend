const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendOTP, generateOTP } = require('../utils/email');
const { protect, checkDevice } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password, fullName, companyName, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate email verification OTP
    const emailOTP = generateOTP();
    const emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      email,
      password,
      fullName,
      companyName: companyName || '',
      phone: phone || '',
      emailVerificationOTP: emailOTP,
      emailVerificationOTPExpiry: emailOTPExpiry,
      subscriptionTier: 'trial',
      subscriptionStatus: 'trial',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    });

    // Send verification email
    await sendOTP(email, emailOTP, 'verification');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with OTP.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+emailVerificationOTP +emailVerificationOTPExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > user.emailVerificationOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend verification OTP
// @access  Public
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+emailVerificationOTP +emailVerificationOTPExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const emailOTP = generateOTP();
    user.emailVerificationOTP = emailOTP;
    user.emailVerificationOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP
    await sendOTP(email, emailOTP, 'verification');

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/request-login-otp
// @desc    Request login OTP
// @access  Public
router.post('/request-login-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+loginOTP +loginOTPExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Generate login OTP
    const loginOTP = generateOTP();
    user.loginOTP = loginOTP;
    user.loginOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP
    await sendOTP(email, loginOTP, 'login');

    res.json({
      success: true,
      message: 'Login OTP sent to your email'
    });
  } catch (error) {
    console.error('Request login OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login with OTP
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('deviceId').notEmpty()
], async (req, res) => {
  try {
    const { email, otp, deviceId } = req.body;

    const user = await User.findOne({ email }).select('+loginOTP +loginOTPExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    if (!user.loginOTP || user.loginOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > user.loginOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if another device is logged in
    // Only block if:
    // 1. currentDevice exists AND has a valid deviceId
    // 2. The deviceId is different from the current request
    // 3. The last login was recent (within 24 hours)
    
    // Clear invalid/empty device objects
    if (user.currentDevice && !user.currentDevice.deviceId) {
      user.currentDevice = undefined;
      await user.save();
    }
    
    if (user.currentDevice && 
        user.currentDevice.deviceId && 
        user.currentDevice.deviceId !== deviceId &&
        user.currentDevice.lastLogin) {
      const lastLoginTime = new Date(user.currentDevice.lastLogin);
      const hoursSinceLastLogin = (new Date() - lastLoginTime) / (1000 * 60 * 60);
      
      // Only block if last login was within 24 hours
      if (hoursSinceLastLogin < 24) {
        return res.status(403).json({
          success: false,
          message: 'Another device is already logged in. Please logout from other device first.',
          code: 'DEVICE_CONFLICT'
        });
      }
      // If last login was more than 24 hours ago, allow the new login (old session expired)
    }

    // Check subscription status
    const now = new Date();
    if (user.subscriptionEndDate < now && user.subscriptionStatus === 'trial') {
      user.subscriptionStatus = 'expired';
      await user.save();
    }

    // Update device info and clear OTP
    user.currentDevice = {
      deviceId: deviceId,
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      lastLogin: new Date()
    };
    user.loginOTP = undefined;
    user.loginOTPExpiry = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, checkDevice, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.currentDevice = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   POST /api/auth/force-logout
// @desc    Force logout from all devices (clears device session using OTP)
// @access  Public (requires valid OTP)
router.post('/force-logout', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+loginOTP +loginOTPExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.loginOTP || user.loginOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > user.loginOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Clear device session
    user.currentDevice = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Device session cleared. You can now login from any device.'
    });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, checkDevice, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        phone: user.phone,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

