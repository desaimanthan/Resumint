const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: false
  },
  jobDescription: {
    type: String,
    required: false,
    default: ''
  },
  generatedContent: {
    type: String,
    required: false,
    default: ''
  },
  fitScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  analysis: {
    skillsMatch: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    experienceRelevance: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    educationFit: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    overallStrengths: [{
      type: String
    }],
    areasForImprovement: [{
      type: String
    }],
    recommendations: [{
      type: String
    }]
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastSaved: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt and lastSaved fields before saving
coverLetterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastSaved = Date.now();
  next();
});

// Index for efficient queries
coverLetterSchema.index({ userId: 1, createdAt: -1 });
coverLetterSchema.index({ userId: 1, resumeId: 1 });

module.exports = mongoose.model('CoverLetter', coverLetterSchema);
