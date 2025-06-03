const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const Analytics = require('../models/Analytics');
const bcrypt = require('bcrypt');
const UAParser = require('ua-parser-js');

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
}

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
    deviceType: result.device.type || 'desktop'
  };
}

// Helper function to return default location
function getDefaultLocation() {
  return {
    country: 'Unknown',
    countryCode: 'XX',
    region: 'Unknown',
    city: 'Unknown',
    timezone: 'UTC',
    coordinates: {
      lat: 0,
      lng: 0
    }
  };
}

// Helper function to get geolocation from IP using ip-api.com (free service)
async function getLocationFromIP(ip) {
  try {
    // Skip localhost/private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      // For localhost/development, return a default location based on your location
      return {
        country: 'India',
        countryCode: 'IN',
        region: 'Maharashtra',
        city: 'Mumbai',
        timezone: 'Asia/Kolkata',
        coordinates: {
          lat: 19.0760,
          lng: 72.8777
        }
      };
    }

    // Use ip-api.com for real IP addresses (free tier: 1000 requests/month)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        region: data.regionName || data.region || 'Unknown',
        city: data.city || 'Unknown',
        timezone: data.timezone || 'UTC',
        coordinates: {
          lat: data.lat || 0,
          lng: data.lon || 0
        }
      };
    } else {
      console.log('IP geolocation failed:', data.message);
      return getDefaultLocation();
    }
  } catch (error) {
    console.error('Error getting location from IP:', error.message);
    return getDefaultLocation();
  }
}

// Get published resume by subdomain
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const resume = await Resume.findOne({ 
      'publication.subdomain': subdomain,
      'publication.isPublished': true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or not published'
      });
    }

    // Check if password protected
    if (resume.publication.isPasswordProtected) {
      return res.json({
        success: true,
        data: {
          isPasswordProtected: true,
          seoMetadata: resume.publication.seoMetadata,
          personalInfo: {
            firstName: resume.personalInfo.firstName,
            lastName: resume.personalInfo.lastName
          }
        }
      });
    }

    // Return full resume data for non-password protected resumes
    const resumeData = {
      ...resume.toObject(),
      userId: undefined, // Remove sensitive data
      publication: {
        ...resume.publication,
        password: undefined // Remove password hash
      }
    };

    res.json({
      success: true,
      data: {
        resume: resumeData,
        isPasswordProtected: false
      }
    });
  } catch (error) {
    console.error('Error fetching published resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume'
    });
  }
});

// Verify password for protected resume
router.post('/:subdomain/verify-password', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { password } = req.body;
    
    const resume = await Resume.findOne({ 
      'publication.subdomain': subdomain,
      'publication.isPublished': true,
      'publication.isPasswordProtected': true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or not password protected'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, resume.publication.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Return full resume data
    const resumeData = {
      ...resume.toObject(),
      userId: undefined, // Remove sensitive data
      publication: {
        ...resume.publication,
        password: undefined // Remove password hash
      }
    };

    res.json({
      success: true,
      data: {
        resume: resumeData,
        isPasswordProtected: true,
        authenticated: true
      }
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify password'
    });
  }
});

// Track visit to published resume (UNIFIED ANALYTICS SYSTEM)
router.post('/:subdomain/track-visit', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { 
      visitorId, 
      sessionDuration = 0, 
      referrer = '',
      screenResolution = '',
      language = '',
      timeZoneOffset = 0,
      colorDepth = 24,
      cookieEnabled = true
    } = req.body;
    
    const resume = await Resume.findOne({ 
      'publication.subdomain': subdomain,
      'publication.isPublished': true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Get client information
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseUserAgent(userAgent);
    const location = await getLocationFromIP(ipAddress);

    console.log(`📍 IP: ${ipAddress} -> Location: ${location.city}, ${location.country} (${location.countryCode})`);

    // Check if this is a new visitor
    const existingVisit = await Analytics.findOne({
      resumeId: resume._id,
      visitorId: visitorId
    });

    const isNewVisitor = !existingVisit;
    
    // Check if this is a new session (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentVisit = await Analytics.findOne({
      resumeId: resume._id,
      visitorId: visitorId,
      timestamp: { $gte: thirtyMinutesAgo }
    });
    
    const isNewSession = !recentVisit;

    // Create analytics entry
    const analyticsEntry = new Analytics({
      resumeId: resume._id,
      visitorId,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      location,
      device: {
        ...deviceInfo,
        screenResolution
      },
      session: {
        duration: sessionDuration,
        referrer,
        entryPage: `/${subdomain}`,
        exitPage: `/${subdomain}`,
        pageViews: 1,
        isNewVisitor
      },
      metadata: {
        language,
        timeZoneOffset,
        colorDepth,
        cookieEnabled
      }
    });

    await analyticsEntry.save();

    // Note: We no longer update resume.publication.analytics here
    // All analytics are now handled through the Analytics collection
    // The publication-status endpoint will calculate analytics from the Analytics collection
    
    if (isNewSession) {
      console.log(`📊 New session tracked: Views +1, New visitor: ${isNewVisitor}`);
    } else {
      console.log(`🔄 Existing session, not counting view`);
    }

    res.json({
      success: true,
      message: 'Visit tracked successfully',
      location: location // Return location for debugging
    });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track visit'
    });
  }
});

// Get basic analytics for a published resume (public endpoint for real-time visitor count)
router.get('/:subdomain/analytics/summary', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const resume = await Resume.findOne({ 
      'publication.subdomain': subdomain,
      'publication.isPublished': true
    }).select('publication.analytics');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Get current active visitors (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeVisitors = await Analytics.countDocuments({
      resumeId: resume._id,
      timestamp: { $gte: fiveMinutesAgo }
    });

    // Get analytics from unified system
    const summary = await Analytics.getAnalyticsSummary(resume._id, 365);

    res.json({
      success: true,
      data: {
        totalViews: summary.totalViews || 0,
        uniqueVisitors: summary.uniqueVisitors || 0,
        activeVisitors,
        lastViewed: summary.lastViewed || null
      }
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
