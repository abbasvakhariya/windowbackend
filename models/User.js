const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    select: false
  },
  emailVerificationOTPExpiry: {
    type: Date,
    select: false
  },
  loginOTP: {
    type: String,
    select: false
  },
  loginOTPExpiry: {
    type: Date,
    select: false
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'trial', '1_month', '3_months', '6_months', '12_months'],
    default: 'trial'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'trial'],
    default: 'trial'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
  },
  currentDevice: {
    deviceId: String,
    deviceInfo: String,
    lastLogin: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);

