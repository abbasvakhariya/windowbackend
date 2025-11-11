const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Only this email can have admin access - hardcoded for security
const ADMIN_EMAIL = 'abbasvakhariya00@gmail.com';

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Check if user is admin - ONLY abbasvakhariya00@gmail.com can be admin
exports.isAdmin = async (req, res, next) => {
  try {
    // Check if user exists and email matches the ONLY admin email
    if (!req.user || !req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const userEmail = req.user.email.toLowerCase();
    
    // ONLY this specific email can access admin panel
    if (userEmail !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Ensure user has admin role in database
    if (req.user.role !== 'admin') {
      await User.findByIdAndUpdate(req.user._id, { role: 'admin' });
      req.user.role = 'admin';
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
};

// Check device ID for single device login
exports.checkDevice = async (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'] || req.body.deviceId;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    const user = await User.findById(req.user._id);

    // If user has a different device logged in
    if (user.currentDevice && user.currentDevice.deviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        message: 'Another device is already logged in. Please logout from other device first.',
        code: 'DEVICE_CONFLICT'
      });
    }

    // Update device info
    user.currentDevice = {
      deviceId: deviceId,
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      lastLogin: new Date()
    };
    await user.save();

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking device'
    });
  }
};

