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

// Helper function to get geolocation from IP (placeholder - you'd use a real service)
async function getLocationFromIP(ip) {
  // In production, you'd use a service like ipapi.co, MaxMind, or similar
  // For now, returning a placeholder
  try {
    // Example using ipapi.co (you'd need to implement this)
    // const response = await fetch(`http://ipapi.co/${ip}/json/`);
    // const data = await response.json();
    
    // Placeholder data
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
  } catch (error) {
    console.error('Error getting location from IP:', error);
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

// Track analytics for published resume (simplified version)
router.post('/:subdomain/analytics', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { userAgent, referrer } = req.body;
    
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

    // Simple analytics tracking
    resume.publication.analytics.totalViews += 1;
    resume.publication.analytics.lastViewed = new Date();
    
    // For simplicity, count each visit as unique for now
    resume.publication.analytics.uniqueVisitors += 1;

    await resume.save();

    res.json({
      success: true,
      message: 'Analytics tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track analytics'
    });
  }
});

// Track visit to published resume
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

    // Check if this is a new visitor
    const existingVisit = await Analytics.findOne({
      resumeId: resume._id,
      visitorId: visitorId
    });

    const isNewVisitor = !existingVisit;

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

    // Update resume analytics summary
    resume.publication.analytics.totalViews += 1;
    resume.publication.analytics.lastViewed = new Date();
    
    if (isNewVisitor) {
      resume.publication.analytics.uniqueVisitors += 1;
    }

    await resume.save();

    res.json({
      success: true,
      message: 'Visit tracked successfully'
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

    res.json({
      success: true,
      data: {
        totalViews: resume.publication.analytics.totalViews,
        uniqueVisitors: resume.publication.analytics.uniqueVisitors,
        activeVisitors,
        lastViewed: resume.publication.analytics.lastViewed
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
