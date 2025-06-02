const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  resumeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resume', 
    required: true,
    index: true
  },
  
  // Visitor identification
  visitorId: { 
    type: String, 
    required: true,
    index: true
  }, // unique identifier for visitor (generated client-side)
  
  // Visit details
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  
  // Geographic information
  location: {
    country: { type: String, trim: true },
    countryCode: { type: String, trim: true },
    region: { type: String, trim: true },
    city: { type: String, trim: true },
    timezone: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Device and browser information
  device: {
    deviceType: { 
      type: String, 
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    browser: { type: String, trim: true },
    browserVersion: { type: String, trim: true },
    os: { type: String, trim: true },
    osVersion: { type: String, trim: true },
    screenResolution: { type: String, trim: true }
  },
  
  // Session information
  session: {
    duration: { type: Number, default: 0 }, // in seconds
    referrer: { type: String, trim: true },
    entryPage: { type: String, trim: true },
    exitPage: { type: String, trim: true },
    pageViews: { type: Number, default: 1 },
    isNewVisitor: { type: Boolean, default: true }
  },
  
  // Additional tracking data
  metadata: {
    language: { type: String, trim: true },
    timeZoneOffset: { type: Number },
    colorDepth: { type: Number },
    cookieEnabled: { type: Boolean }
  }
  
}, { 
  timestamps: true 
});

// Indexes for efficient querying
analyticsSchema.index({ resumeId: 1, timestamp: -1 });
analyticsSchema.index({ visitorId: 1, timestamp: -1 });
analyticsSchema.index({ 'location.country': 1 });
analyticsSchema.index({ 'device.deviceType': 1 });
analyticsSchema.index({ timestamp: -1 });

// Static method to get analytics summary for a resume
analyticsSchema.statics.getAnalyticsSummary = async function(resumeId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  const pipeline = [
    {
      $match: {
        resumeId: new mongoose.Types.ObjectId(resumeId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' },
        avgSessionDuration: { $avg: '$session.duration' },
        topCountries: { $push: '$location.country' },
        deviceTypes: { $push: '$device.deviceType' },
        referrers: { $push: '$session.referrer' }
      }
    },
    {
      $project: {
        totalViews: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        avgSessionDuration: { $round: ['$avgSessionDuration', 0] },
        topCountries: 1,
        deviceTypes: 1,
        referrers: 1
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalViews: 0,
    uniqueVisitors: 0,
    avgSessionDuration: 0,
    topCountries: [],
    deviceTypes: [],
    referrers: []
  };
};

// Static method to get daily analytics for charts
analyticsSchema.statics.getDailyAnalytics = async function(resumeId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        resumeId: new mongoose.Types.ObjectId(resumeId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }
    },
    {
      $sort: { date: 1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get geographic distribution
analyticsSchema.statics.getGeographicDistribution = async function(resumeId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  const pipeline = [
    {
      $match: {
        resumeId: new mongoose.Types.ObjectId(resumeId),
        timestamp: { $gte: startDate },
        'location.country': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: {
          country: '$location.country',
          countryCode: '$location.countryCode'
        },
        visitors: { $addToSet: '$visitorId' },
        views: { $sum: 1 }
      }
    },
    {
      $project: {
        country: '$_id.country',
        countryCode: '$_id.countryCode',
        visitors: { $size: '$visitors' },
        views: 1
      }
    },
    {
      $sort: { visitors: -1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Analytics', analyticsSchema);
