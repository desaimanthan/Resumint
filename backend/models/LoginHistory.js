const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  loginTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  location: {
    city: String,
    country: String,
    region: String
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
loginHistorySchema.index({ userId: 1, loginTime: -1 });

// Auto-delete old login history after 90 days
loginHistorySchema.index({ loginTime: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
