const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: mongoose.Schema.Types.Mixed,
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  category: {
    type: String,
    default: 'general'
  },
  description: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

