const mongoose = require('mongoose');

const videoRedirectSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/,
    minlength: 2,
    maxlength: 50
  },
  destinationUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  clickCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
videoRedirectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster lookups
videoRedirectSchema.index({ shortCode: 1 });
videoRedirectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('VideoRedirect', videoRedirectSchema);
