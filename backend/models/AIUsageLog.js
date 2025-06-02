const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  resumeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resume', 
    required: true,
    index: true
  },
  operation: { 
    type: String, 
    required: true,
    enum: ['pdf_parsing', 'optimization', 'enhancement'],
    index: true
  },
  model: { 
    type: String, 
    required: true,
    trim: true
  },
  inputTokens: { 
    type: Number, 
    required: true,
    min: 0
  },
  outputTokens: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalTokens: { 
    type: Number, 
    required: true,
    min: 0
  },
  cost: { 
    type: Number, 
    required: true,
    min: 0
  }, // estimated cost in USD
  metadata: {
    fileName: { type: String, trim: true },
    fileSize: { type: Number },
    processingTime: { type: Number }, // in milliseconds
    success: { type: Boolean, default: true },
    errorMessage: { type: String, trim: true }
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true
});

// Compound indexes for efficient queries
aiUsageLogSchema.index({ userId: 1, timestamp: -1 });
aiUsageLogSchema.index({ resumeId: 1, operation: 1 });
aiUsageLogSchema.index({ operation: 1, timestamp: -1 });

// Pre-save middleware to calculate total tokens
aiUsageLogSchema.pre('save', function(next) {
  this.totalTokens = this.inputTokens + this.outputTokens;
  next();
});

// Static method to get user usage stats for a period
aiUsageLogSchema.statics.getUserUsageStats = async function(userId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate },
        'metadata.success': true
      }
    },
    {
      $group: {
        _id: '$operation',
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$cost' },
        operationCount: { $sum: 1 }
      }
    }
  ]);
  
  return stats;
};

// Static method to get monthly usage for a user
aiUsageLogSchema.statics.getMonthlyUsage = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const usage = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate },
        'metadata.success': true
      }
    },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$cost' },
        totalOperations: { $sum: 1 },
        pdfParsingTokens: {
          $sum: {
            $cond: [{ $eq: ['$operation', 'pdf_parsing'] }, '$totalTokens', 0]
          }
        },
        optimizationTokens: {
          $sum: {
            $cond: [{ $eq: ['$operation', 'optimization'] }, '$totalTokens', 0]
          }
        }
      }
    }
  ]);
  
  return usage[0] || {
    totalTokens: 0,
    totalCost: 0,
    totalOperations: 0,
    pdfParsingTokens: 0,
    optimizationTokens: 0
  };
};

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);
