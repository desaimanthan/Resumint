const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
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
  questions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['setup', 'ready', 'in_progress', 'completed', 'cancelled'],
    default: 'setup'
  },
  
  // Interview Session Data
  sessionData: {
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    transcript: {
      type: String,
      default: ''
    },
    audioRecordingUrl: {
      type: String
    },
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    questionsAsked: [{
      question: String,
      answer: String,
      timestamp: Date
    }]
  },
  
  // AI Analysis & Feedback
  analysis: {
    overallScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    communicationSkills: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    technicalKnowledge: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    problemSolving: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    strengths: [{
      type: String
    }],
    areasForImprovement: [{
      type: String
    }],
    recommendations: [{
      type: String
    }],
    detailedFeedback: {
      type: String,
      default: ''
    }
  },
  
  isDraft: {
    type: Boolean,
    default: true
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
mockInterviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastSaved = Date.now();
  next();
});

// Index for efficient queries
mockInterviewSchema.index({ userId: 1, createdAt: -1 });
mockInterviewSchema.index({ userId: 1, resumeId: 1 });
mockInterviewSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
