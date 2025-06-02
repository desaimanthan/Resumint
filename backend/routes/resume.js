const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
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
    const { title = 'My Resume' } = req.body;

    // Initialize with user's basic info from their account
    const resumeData = {
      userId: req.user.id,
      title,
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

module.exports = router;
