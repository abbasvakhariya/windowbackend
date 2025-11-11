const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planType: {
    type: String,
    enum: ['1_month', '3_months', '6_months', '12_months'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi_annual', 'annual'],
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'paypal'
  },
  paypalPaymentId: {
    type: String
  },
  paypalOrderId: {
    type: String
  },
  transactionId: {
    type: String
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

module.exports = mongoose.model('Subscription', subscriptionSchema);

