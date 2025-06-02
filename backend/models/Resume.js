const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Personal Information
  personalInfo: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    linkedIn: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    github: { type: String, trim: true },
    profilePhoto: { type: String, trim: true }
  },

  // Work History
  workHistory: [{
    jobTitle: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    companyLogo: { type: String, trim: true },
    companyDomain: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrentRole: { type: Boolean, default: false },
    responsibilities: [{ type: String, trim: true }],
    achievements: [{
      description: { type: String, trim: true },
      metric: { type: String, trim: true }
    }],
    technologies: [{ type: String, trim: true }],
    location: { type: String, trim: true }
  }],

  // Education
  education: [{
    degreeLevel: { 
      type: String, 
      trim: true
    },
    institution: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    gpa: { type: Number, min: 0, max: 4.0 },
    honors: { type: String, trim: true },
    relevantCoursework: [{ type: String, trim: true }]
  }],

  // Certifications
  certifications: [{
    name: { type: String, trim: true },
    issuer: { type: String, trim: true },
    dateObtained: { type: Date },
    expirationDate: { type: Date },
    credentialId: { type: String, trim: true },
    verificationUrl: { type: String, trim: true }
  }],

  // Skills
  skills: [{
    skillName: { type: String, trim: true },
    category: { 
      type: String, 
      trim: true,
      default: 'Technical'
    }
  }],

  // Projects
  projects: [{
    projectName: { type: String, trim: true },
    role: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, trim: true },
    technologies: [{ type: String, trim: true }],
    outcome: { type: String, trim: true },
    projectUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true }
  }],

  // Other Achievements
  otherAchievements: [{
    title: { type: String, trim: true },
    issuer: { type: String, trim: true },
    date: { type: Date },
    description: { type: String, trim: true }
  }],

  // Professional Summary
  summary: { type: String, trim: true, maxlength: 500 },

  // Optional Sections
  optionalSections: {
    languages: [{
      language: { type: String, trim: true },
      proficiency: { 
        type: String, 
        enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
        default: 'Conversational'
      }
    }],
    volunteerWork: [{
      organization: { type: String, trim: true },
      role: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String, trim: true }
    }],
    publications: [{
      title: { type: String, trim: true },
      publisher: { type: String, trim: true },
      date: { type: Date },
      url: { type: String, trim: true }
    }],
    hobbies: [{ type: String, trim: true }]
  },

  // Metadata
  isDraft: { type: Boolean, default: true },
  lastSaved: { type: Date, default: Date.now },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  templateId: { type: String, default: 'default' },
  title: { type: String, trim: true, default: 'My Resume' },
  
  // Creation method and AI usage tracking
  creationMethod: {
    type: String,
    enum: ['scratch', 'pdf_upload'],
    default: 'scratch'
  },
  aiUsage: {
    pdfParsingTokens: { type: Number, default: 0 },
    optimizationTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    lastUpdated: { type: Date }
  },
  pdfParsingMetadata: {
    fileName: { type: String, trim: true },
    fileSize: { type: Number },
    pageCount: { type: Number },
    processingTime: { type: Number },
    claudeModel: { type: String, trim: true },
    parsedAt: { type: Date }
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
resumeSchema.index({ userId: 1, updatedAt: -1 });

// Virtual for full name
resumeSchema.virtual('personalInfo.fullName').get(function() {
  if (this.personalInfo.firstName && this.personalInfo.lastName) {
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
  }
  return '';
});

// Method to calculate completion percentage
resumeSchema.methods.calculateCompletionPercentage = function() {
  let completed = 0;
  const totalSections = 8; // Personal info, work, education, skills, summary, etc.

  // Personal info (required)
  if (this.personalInfo.firstName && this.personalInfo.lastName && this.personalInfo.email) {
    completed += 1;
  }

  // Work history (at least one entry)
  if (this.workHistory && this.workHistory.length > 0) {
    completed += 1;
  }

  // Education (at least one entry)
  if (this.education && this.education.length > 0) {
    completed += 1;
  }

  // Skills (at least 3 skills)
  if (this.skills && this.skills.length >= 3) {
    completed += 1;
  }

  // Summary
  if (this.summary && this.summary.length > 50) {
    completed += 1;
  }

  // Optional sections count as partial completion
  let optionalCompleted = 0;
  if (this.certifications && this.certifications.length > 0) optionalCompleted += 1;
  if (this.projects && this.projects.length > 0) optionalCompleted += 1;
  if (this.optionalSections.languages && this.optionalSections.languages.length > 0) optionalCompleted += 1;

  // Add partial credit for optional sections
  completed += Math.min(optionalCompleted / 3, 3);

  this.completionPercentage = Math.round((completed / totalSections) * 100);
  return this.completionPercentage;
};

// Pre-save middleware to update completion percentage
resumeSchema.pre('save', function(next) {
  this.lastSaved = new Date();
  this.calculateCompletionPercentage();
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
