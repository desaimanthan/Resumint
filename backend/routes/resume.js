const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const Analytics = require('../models/Analytics');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

// Get all resumes for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title isDraft completionPercentage lastSaved createdAt updatedAt');
    
    res.json({
      success: true,
      data: { resumes }
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes'
    });
  }
});

// Get a specific resume
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume'
    });
  }
});

// Create a new resume
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title = 'My Resume', creationMethod = 'scratch' } = req.body;

    // Initialize with user's basic info from their account
    const resumeData = {
      userId: req.user.id,
      title,
      creationMethod,
      personalInfo: {
        firstName: req.user.firstName || '',
        lastName: req.user.lastName || '',
        email: req.user.email || '',
        profilePhoto: req.user.profilePicture || ''
      },
      workHistory: [],
      education: [],
      certifications: [],
      skills: [],
      projects: [],
      otherAchievements: [],
      summary: '',
      optionalSections: {
        languages: [],
        volunteerWork: [],
        publications: [],
        hobbies: []
      },
      aiUsage: {
        pdfParsingTokens: 0,
        optimizationTokens: 0,
        totalTokens: 0
      }
    };

    const resume = new Resume(resumeData);
    await resume.save();

    res.status(201).json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('Error creating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resume'
    });
  }
});

// Update a resume
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Update the resume with provided data
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && key !== '_id') {
        resume[key] = req.body[key];
      }
    });

    await resume.save();

    res.json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resume'
    });
  }
});

// Auto-save endpoint for drafts
router.patch('/:id/autosave', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Update only the provided fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && key !== '_id') {
        resume[key] = req.body[key];
      }
    });

    resume.lastSaved = new Date();
    await resume.save();

    res.json({
      success: true,
      data: { 
        lastSaved: resume.lastSaved,
        completionPercentage: resume.completionPercentage
      }
    });
  } catch (error) {
    console.error('Error auto-saving resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-save resume'
    });
  }
});

// Draft save endpoint that bypasses validation for incomplete entries
router.patch('/:id/draft', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // For draft saves, we want to save all data including incomplete entries
    // Use findOneAndUpdate with validation disabled for draft saves
    const updatedResume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        ...req.body,
        isDraft: true,
        lastSaved: new Date()
      },
      { 
        new: true,
        runValidators: false // Disable validation for draft saves
      }
    );

    res.json({
      success: true,
      data: { resume: updatedResume }
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save draft'
    });
  }
});

// Delete a resume
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
});

// Duplicate a resume
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const originalResume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!originalResume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Create a copy without the _id and timestamps
    const resumeData = originalResume.toObject();
    delete resumeData._id;
    delete resumeData.createdAt;
    delete resumeData.updatedAt;
    delete resumeData.__v;

    // Update title and reset metadata
    resumeData.title = `${resumeData.title} (Copy)`;
    resumeData.isDraft = true;
    resumeData.lastSaved = new Date();

    const newResume = new Resume(resumeData);
    await newResume.save();

    res.status(201).json({
      success: true,
      data: { resume: newResume }
    });
  } catch (error) {
    console.error('Error duplicating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate resume'
    });
  }
});

// Update resume status (draft/published)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { isDraft } = req.body;
    
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.isDraft = isDraft;
    await resume.save();

    res.json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('Error updating resume status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resume status'
    });
  }
});

// Get resume analytics/stats
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const analytics = {
      completionPercentage: resume.completionPercentage,
      sectionsCompleted: {
        personalInfo: !!(resume.personalInfo.firstName && resume.personalInfo.lastName && resume.personalInfo.email),
        workHistory: resume.workHistory.length > 0,
        education: resume.education.length > 0,
        skills: resume.skills.length >= 3,
        summary: resume.summary && resume.summary.length > 50,
        certifications: resume.certifications.length > 0,
        projects: resume.projects.length > 0,
        optionalSections: (
          (resume.optionalSections.languages?.length || 0) +
          (resume.optionalSections.volunteerWork?.length || 0) +
          (resume.optionalSections.publications?.length || 0) +
          (resume.optionalSections.hobbies?.length || 0)
        ) > 0
      },
      wordCount: {
        summary: resume.summary ? resume.summary.split(' ').length : 0,
        responsibilities: resume.workHistory.reduce((total, job) => 
          total + job.responsibilities.join(' ').split(' ').length, 0),
        achievements: resume.workHistory.reduce((total, job) => 
          total + job.achievements.reduce((achTotal, ach) => 
            achTotal + (ach.description || '').split(' ').length, 0), 0)
      },
      lastUpdated: resume.updatedAt,
      created: resume.createdAt
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    console.error('Error fetching resume analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume analytics'
    });
  }
});

// Helper function to generate subdomain from title
function generateSubdomain(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Check subdomain availability
router.get('/:id/check-subdomain/:subdomain', authenticateToken, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { id } = req.params;
    
    // Check if subdomain is already taken by another resume
    const existingResume = await Resume.findOne({ 
      'publication.subdomain': subdomain,
      _id: { $ne: id } // Exclude current resume
    });
    
    res.json({
      success: true,
      data: { 
        available: !existingResume,
        subdomain 
      }
    });
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subdomain availability'
    });
  }
});

// Get publication status
router.get('/:id/publication-status', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching publication status for resume ID:', req.params.id, 'User ID:', req.user.id);
    
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    }).select('publication title');

    if (!resume) {
      console.log('❌ Resume not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    console.log('📊 Resume found, publication data:', resume.publication);
    console.log('📝 Resume title:', resume.title);

    const responseData = {
      success: true,
      data: { 
        publication: resume.publication,
        suggestedSubdomain: generateSubdomain(resume.title)
      }
    };

    console.log('📤 Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('💥 Error fetching publication status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch publication status'
    });
  }
});

// Publish resume
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 Publishing resume ID:', req.params.id, 'for user:', req.user.id);
    console.log('📝 Publish request body:', req.body);
    
    const { 
      subdomain, 
      isPasswordProtected = false, 
      password = null,
      seoMetadata = {} 
    } = req.body;

    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      console.log('❌ Resume not found for publishing');
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    console.log('📊 Resume found, current publication status:', resume.publication);

    // Clean up data before publishing
    // Filter out incomplete work history entries
    if (resume.workHistory) {
      resume.workHistory = resume.workHistory.filter(job => 
        job.jobTitle && job.jobTitle.trim() && 
        job.company && job.company.trim()
      );
    }

    // Convert location object to string if needed
    if (resume.personalInfo.location && typeof resume.personalInfo.location === 'object') {
      const loc = resume.personalInfo.location;
      if (loc.city || loc.state || loc.country) {
        resume.personalInfo.location = [loc.city, loc.state, loc.country]
          .filter(Boolean)
          .join(', ');
      } else {
        resume.personalInfo.location = '';
      }
    }

    // Check if subdomain is available
    const existingResume = await Resume.findOne({ 
      'publication.subdomain': subdomain,
      _id: { $ne: req.params.id }
    });

    if (existingResume) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is already taken'
      });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (isPasswordProtected && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Auto-generate SEO metadata if not provided
    const autoSeoMetadata = {
      title: seoMetadata.title || `${resume.personalInfo.firstName} ${resume.personalInfo.lastName} - Resume`,
      description: seoMetadata.description || resume.summary?.substring(0, 160) || `Professional resume of ${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`,
      keywords: seoMetadata.keywords || resume.skills.map(skill => skill.skillName).slice(0, 10),
      ogImage: seoMetadata.ogImage || resume.personalInfo.profilePhoto
    };

    // Update publication settings
    resume.publication = {
      isPublished: true,
      subdomain,
      isPasswordProtected,
      password: hashedPassword,
      publishedAt: new Date(),
      seoMetadata: autoSeoMetadata,
      analytics: {
        totalViews: 0,
        uniqueVisitors: 0,
        lastViewed: null
      }
    };

    console.log('💾 Saving resume with publication data:', resume.publication);
    await resume.save();
    console.log('✅ Resume saved successfully');

    // Verify the save worked by fetching the resume again
    const savedResume = await Resume.findById(req.params.id).select('publication');
    console.log('🔍 Verification - saved publication data:', savedResume.publication);

    const responseData = {
      success: true,
      data: { 
        publication: resume.publication,
        url: `${subdomain}.${process.env.DOMAIN || 'localhost'}`
      }
    };

    console.log('📤 Sending publish response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error publishing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish resume'
    });
  }
});

// Update publication settings
router.put('/:id/publication-settings', authenticateToken, async (req, res) => {
  try {
    const { 
      subdomain, 
      isPasswordProtected, 
      password,
      seoMetadata 
    } = req.body;

    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (!resume.publication.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Resume is not published'
      });
    }

    // Check subdomain availability if changed
    if (subdomain && subdomain !== resume.publication.subdomain) {
      const existingResume = await Resume.findOne({ 
        'publication.subdomain': subdomain,
        _id: { $ne: req.params.id }
      });

      if (existingResume) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain is already taken'
        });
      }
      resume.publication.subdomain = subdomain;
    }

    // Update password if provided
    if (isPasswordProtected !== undefined) {
      resume.publication.isPasswordProtected = isPasswordProtected;
      if (isPasswordProtected && password) {
        resume.publication.password = await bcrypt.hash(password, 10);
      } else if (!isPasswordProtected) {
        resume.publication.password = null;
      }
    }

    // Update SEO metadata
    if (seoMetadata) {
      resume.publication.seoMetadata = {
        ...resume.publication.seoMetadata,
        ...seoMetadata
      };
    }

    await resume.save();

    res.json({
      success: true,
      data: { publication: resume.publication }
    });
  } catch (error) {
    console.error('Error updating publication settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update publication settings'
    });
  }
});

// Unpublish resume
router.delete('/:id/unpublish', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    resume.publication.isPublished = false;
    resume.publication.subdomain = null;
    resume.publication.publishedAt = null;
    
    await resume.save();

    res.json({
      success: true,
      message: 'Resume unpublished successfully'
    });
  } catch (error) {
    console.error('Error unpublishing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish resume'
    });
  }
});

// Get detailed analytics for published resume
router.get('/:id/publication-analytics', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (!resume.publication.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Resume is not published'
      });
    }

    // Get analytics summary
    const summary = await Analytics.getAnalyticsSummary(req.params.id, parseInt(days));
    
    // Get daily analytics for charts
    const dailyAnalytics = await Analytics.getDailyAnalytics(req.params.id, parseInt(days));
    
    // Get geographic distribution
    const geographicData = await Analytics.getGeographicDistribution(req.params.id, parseInt(days));

    res.json({
      success: true,
      data: {
        summary,
        dailyAnalytics,
        geographicData,
        publication: resume.publication
      }
    });
  } catch (error) {
    console.error('Error fetching publication analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch publication analytics'
    });
  }
});

module.exports = router;
