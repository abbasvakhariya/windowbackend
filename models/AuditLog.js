const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: String,
  changes: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

