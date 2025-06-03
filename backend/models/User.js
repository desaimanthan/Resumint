const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  profilePicture: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // AI Usage Statistics
  aiUsageStats: {
    totalTokensUsed: { type: Number, default: 0 },
    totalCostUSD: { type: Number, default: 0 },
    pdfParsingTokens: { type: Number, default: 0 },
    optimizationTokens: { type: Number, default: 0 },
    resumesParsed: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    monthlyUsage: [{
      month: { type: String }, // YYYY-MM format
      tokens: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      operations: { type: Number, default: 0 }
    }]
  },
  
  // Usage Limits and Billing
  usageLimits: {
    monthlyTokenLimit: { type: Number, default: 100000 }, // 100K tokens per month
    monthlyCostLimit: { type: Number, default: 50.0 }, // $50 per month
    dailyTokenLimit: { type: Number, default: 10000 }, // 10K tokens per day
    dailyCostLimit: { type: Number, default: 5.0 }, // $5 per day
    isLimitEnabled: { type: Boolean, default: true },
    alertThresholds: {
      tokenWarning: { type: Number, default: 0.8 }, // 80% of limit
      costWarning: { type: Number, default: 0.8 } // 80% of limit
    }
  },
  
  // Billing Information
  billing: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    subscriptionId: { type: String, default: null },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    nextBillingDate: { type: Date, default: null },
    paymentMethod: {
      type: { type: String, enum: ['card', 'paypal'], default: null },
      last4: { type: String, default: null },
      brand: { type: String, default: null }
    },
    invoiceHistory: [{
      invoiceId: { type: String },
      amount: { type: Number },
      currency: { type: String, default: 'USD' },
      status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
      billingPeriod: {
        start: { type: Date },
        end: { type: Date }
      },
      createdAt: { type: Date, default: Date.now }
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
