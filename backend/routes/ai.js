const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const Resume = require('../models/Resume');
const User = require('../models/User');
const AIUsageLog = require('../models/AIUsageLog');

const router = express.Router();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 32 * 1024 * 1024, // 32MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Token cost calculation
const TOKEN_COSTS = {
  'claude-3-7-sonnet-20250219': {
    input: 0.003 / 1000,  // $0.003 per 1K input tokens
    output: 0.015 / 1000  // $0.015 per 1K output tokens
  },
  'claude-3-5-haiku-20241022': {
    input: 0.00025 / 1000,
    output: 0.00125 / 1000
  }
};

function calculateCost(inputTokens, outputTokens, model) {
  const rates = TOKEN_COSTS[model] || TOKEN_COSTS['claude-3-7-sonnet-20250219'];
  return (inputTokens * rates.input) + (outputTokens * rates.output);
}

// Helper function to safely parse dates
function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') {
    return null;
  }
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}



// Log AI usage
async function logAIUsage(userId, resumeId, operation, tokenData, metadata) {
  try {
    const cost = calculateCost(tokenData.inputTokens, tokenData.outputTokens, metadata.claudeModel || 'claude-3-7-sonnet-20250219');
    
    // Create usage log entry
    const usageLog = new AIUsageLog({
      userId,
      resumeId,
      operation,
      model: metadata.claudeModel || 'claude-3-7-sonnet-20250219',
      inputTokens: tokenData.inputTokens,
      outputTokens: tokenData.outputTokens,
      totalTokens: tokenData.inputTokens + tokenData.outputTokens,
      cost,
      metadata
    });
    
    await usageLog.save();
    
    // Update user's usage stats
    const user = await User.findById(userId);
    if (user) {
      if (!user.aiUsageStats) {
        user.aiUsageStats = {
          totalTokensUsed: 0,
          totalCostUSD: 0,
          pdfParsingTokens: 0,
          optimizationTokens: 0,
          resumesParsed: 0,
          lastResetDate: new Date(),
          monthlyUsage: []
        };
      }
      
      // Ensure totalCostUSD field exists
      if (typeof user.aiUsageStats.totalCostUSD !== 'number') {
        user.aiUsageStats.totalCostUSD = 0;
      }
      
      user.aiUsageStats.totalTokensUsed += tokenData.inputTokens + tokenData.outputTokens;
      user.aiUsageStats.totalCostUSD += cost;
      
      if (operation === 'pdf_parsing') {
        user.aiUsageStats.pdfParsingTokens += tokenData.inputTokens + tokenData.outputTokens;
        user.aiUsageStats.resumesParsed += 1;
      } else if (operation === 'optimization') {
        user.aiUsageStats.optimizationTokens += tokenData.inputTokens + tokenData.outputTokens;
      }
      
      // Update monthly usage
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      let monthlyEntry = user.aiUsageStats.monthlyUsage.find(m => m.month === currentMonth);
      
      if (!monthlyEntry) {
        monthlyEntry = { month: currentMonth, tokens: 0, cost: 0, operations: 0 };
        user.aiUsageStats.monthlyUsage.push(monthlyEntry);
      }
      
      monthlyEntry.tokens += tokenData.inputTokens + tokenData.outputTokens;
      monthlyEntry.cost += cost;
      monthlyEntry.operations += 1;
      
      await user.save();
    }
    
    // Update resume's AI usage
    const resume = await Resume.findById(resumeId);
    if (resume) {
      if (!resume.aiUsage) {
        resume.aiUsage = {
          pdfParsingTokens: 0,
          optimizationTokens: 0,
          totalTokens: 0
        };
      }
      
      if (operation === 'pdf_parsing') {
        resume.aiUsage.pdfParsingTokens += tokenData.inputTokens + tokenData.outputTokens;
      } else if (operation === 'optimization') {
        resume.aiUsage.optimizationTokens += tokenData.inputTokens + tokenData.outputTokens;
      }
      
      resume.aiUsage.totalTokens += tokenData.inputTokens + tokenData.outputTokens;
      resume.aiUsage.lastUpdated = new Date();
      
      await resume.save();
    }
    
    return { cost, totalTokens: tokenData.inputTokens + tokenData.outputTokens };
  } catch (error) {
    console.error('Error logging AI usage:', error);
    return { cost: 0, totalTokens: tokenData.inputTokens + tokenData.outputTokens };
  }
}

// Generate professional summary using AI
router.post('/generate-summary', authenticateToken, async (req, res) => {
  try {
    const { keywords, resumeId } = req.body;

    if (!keywords || !keywords.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Keywords are required'
      });
    }

    // Get user's resume data for context (optional)
    let resumeContext = '';
    if (resumeId) {
      try {
        const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
        if (resume) {
          // Build context from existing resume data
          const contextParts = [];
          
          if (resume.personalInfo.firstName && resume.personalInfo.lastName) {
            contextParts.push(`Name: ${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`);
          }
          
          if (resume.workHistory && resume.workHistory.length > 0) {
            const recentJob = resume.workHistory[0];
            contextParts.push(`Current/Recent Role: ${recentJob.jobTitle} at ${recentJob.companyName}`);
            
            if (recentJob.responsibilities && recentJob.responsibilities.length > 0) {
              contextParts.push(`Key Responsibilities: ${recentJob.responsibilities.slice(0, 3).join(', ')}`);
            }
            
            if (recentJob.achievements && recentJob.achievements.length > 0) {
              const achievements = recentJob.achievements.slice(0, 2).map(a => a.description).join(', ');
              contextParts.push(`Key Achievements: ${achievements}`);
            }
          }
          
          if (resume.skills && resume.skills.length > 0) {
            const skills = resume.skills.slice(0, 8).map(s => s.skillName).join(', ');
            contextParts.push(`Skills: ${skills}`);
          }
          
          if (resume.education && resume.education.length > 0) {
            const education = resume.education[0];
            contextParts.push(`Education: ${education.degreeLevel} in ${education.fieldOfStudy} from ${education.institution}`);
          }
          
          if (contextParts.length > 0) {
            resumeContext = `\n\nExisting resume context:\n${contextParts.join('\n')}`;
          }
        }
      } catch (error) {
        console.log('Could not fetch resume context:', error.message);
        // Continue without context
      }
    }

    // Create the system prompt for generating professional summaries
    const systemPrompt = `You are an expert resume writer. Generate a professional summary that is EXACTLY 2-3 sentences and MUST be under 400 characters total.

STRICT REQUIREMENTS:
- Maximum 400 characters (including spaces and punctuation)
- Exactly 2-3 sentences
- Start with job title and years of experience
- Include 1 key achievement with a metric
- Use action verbs and relevant keywords
- Be concise and impactful

IMPORTANT: Count characters carefully. If the summary exceeds 400 characters, make it shorter by removing words while keeping the core message.

Return ONLY the summary text, nothing else.`;

    const userPrompt = `Generate a professional resume summary based on these keywords: "${keywords}"${resumeContext}

Create a compelling 2-3 sentence professional summary that incorporates these keywords naturally and showcases the candidate's value proposition. Focus on achievements, skills, and experience level that would appeal to employers in this field.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 120,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const generatedSummary = response.content[0].text.trim();

    // Validate the response
    if (!generatedSummary || generatedSummary.length < 50) {
      throw new Error('Generated summary is too short or empty');
    }

    if (generatedSummary.length > 450) {
      throw new Error('Generated summary is too long');
    }

    // Log AI usage
    const tokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens
    };

    const usageResult = await logAIUsage(
      req.user.id,
      resumeId,
      "summary_generation",
      tokenUsage,
      {
        keywords: keywords,
        claudeModel: "claude-3-7-sonnet-20250219",
        success: true,
        summaryLength: generatedSummary.length
      }
    );

    res.json({
      success: true,
      data: {
        summary: generatedSummary,
        keywords: keywords,
        usage: {
          inputTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.inputTokens + tokenUsage.outputTokens,
          estimatedCost: usageResult.cost
        }
      }
    });

  } catch (error) {
    console.error('AI Summary Generation Error:', error);
    
    // Handle specific Anthropic API errors
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'AI service configuration error. Please contact support.'
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'AI service is currently busy. Please try again in a moment.'
      });
    }
    
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        message: 'AI service configuration error. Please contact support.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate summary. Please try again or write your summary manually.'
    });
  }
});

// Parse PDF resume using Claude AI
router.post('/parse-resume-pdf', authenticateToken, upload.single('pdf'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file provided'
      });
    }

    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required'
      });
    }

    // Verify resume belongs to user
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Convert PDF buffer to base64
    const pdfBase64 = req.file.buffer.toString('base64');
    
    // Create parsing prompt
    const systemPrompt = `You are an expert resume parser. Extract ALL information from the provided PDF resume and return it in the exact JSON format specified below. Be thorough and accurate.

IMPORTANT INSTRUCTIONS:
- Extract ALL text content from the resume
- Parse dates in YYYY-MM-DD format (use YYYY-MM-01 if only month/year provided)
- If information is missing, use empty strings or empty arrays
- For skills, extract individual skills as separate items
- For work history, extract each job as a separate entry
- For education, extract each degree/certification as separate entry
- Be precise with company names, job titles, and dates
- Extract achievements and responsibilities separately

Return ONLY valid JSON in this exact structure:`;

    const jsonStructure = {
      personalInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        location: "",
        linkedinUrl: "",
        portfolioUrl: ""
      },
      summary: "",
      workHistory: [{
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        description: "",
        location: ""
      }],
      education: [{
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        location: ""
      }],
      skills: [],
      projects: [{
        name: "",
        description: "",
        technologies: [],
        startDate: "",
        endDate: "",
        url: ""
      }]
    };

    const userPrompt = `Parse this resume PDF and extract all information into the JSON structure provided. Be thorough and accurate:\n\n${JSON.stringify(jsonStructure, null, 2)}`;

    // Call Claude API with PDF
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [{
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64
          }
        }, {
          type: 'text',
          text: userPrompt
        }]
      }]
    });

    const processingTime = Date.now() - startTime;
    
    // Extract and parse the response
    let parsedData;
    try {
      const responseText = response.content[0].text.trim();
      // Remove any markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?|```\n?/g, '').trim();
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      throw new Error('Failed to parse resume data from AI response');
    }

    // Transform parsed data to match Resume model structure
    const transformedData = {
      personalInfo: {
        firstName: parsedData.personalInfo?.firstName || '',
        lastName: parsedData.personalInfo?.lastName || '',
        email: parsedData.personalInfo?.email || '',
        phone: parsedData.personalInfo?.phone || '',
        location: {
          city: parsedData.personalInfo?.location?.split(',')[0]?.trim() || '',
          state: parsedData.personalInfo?.location?.split(',')[1]?.trim() || '',
          country: parsedData.personalInfo?.location?.split(',')[2]?.trim() || ''
        },
        linkedIn: parsedData.personalInfo?.linkedinUrl || '',
        portfolio: parsedData.personalInfo?.portfolioUrl || ''
      },
      summary: parsedData.summary || '',
      workHistory: (parsedData.workHistory || []).map(job => ({
        jobTitle: job.position || '',
        companyName: job.company || '',
        startDate: parseDate(job.startDate),
        endDate: parseDate(job.endDate),
        isCurrentRole: !job.endDate || job.endDate.toLowerCase().includes('present'),
        responsibilities: job.description ? [job.description] : [],
        achievements: [],
        technologies: [],
        location: job.location || ''
      })),
      education: (parsedData.education || []).map(edu => ({
        degreeLevel: edu.degree || '',
        institution: edu.institution || '',
        fieldOfStudy: edu.field || '',
        startDate: parseDate(edu.startDate),
        endDate: parseDate(edu.endDate),
        gpa: edu.gpa ? parseFloat(edu.gpa) : null,
        honors: '',
        relevantCoursework: []
      })),
      skills: (parsedData.skills || []).map(skill => ({
        skillName: typeof skill === 'string' ? skill : skill.name || '',
        category: 'Technical'
      })),
      projects: (parsedData.projects || []).map(project => ({
        projectName: project.name || '',
        role: '',
        startDate: parseDate(project.startDate),
        endDate: parseDate(project.endDate),
        description: project.description || '',
        technologies: project.technologies || [],
        outcome: '',
        projectUrl: project.url || '',
        githubUrl: ''
      }))
    };

    // Update resume with parsed data
    Object.assign(resume, transformedData);
    
    // Update PDF parsing metadata
    resume.pdfParsingMetadata = {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      pageCount: 1, // We can't easily determine page count from buffer
      processingTime,
      claudeModel: 'claude-3-7-sonnet-20250219',
      parsedAt: new Date()
    };

    await resume.save();

    // Log AI usage
    const tokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens
    };

    const usageResult = await logAIUsage(
      req.user.id,
      resumeId,
      'pdf_parsing',
      tokenUsage,
      {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTime,
        claudeModel: 'claude-3-7-sonnet-20250219',
        success: true
      }
    );

    res.json({
      success: true,
      data: {
        parsedData: transformedData,
        usage: {
          inputTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.inputTokens + tokenUsage.outputTokens,
          estimatedCost: usageResult.cost
        },
        metadata: {
          processingTime,
          fileName: req.file.originalname,
          fileSize: req.file.size
        }
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('PDF Parsing Error:', error);

    // Log failed usage
    if (req.body.resumeId) {
      await logAIUsage(
        req.user.id,
        req.body.resumeId,
        'pdf_parsing',
        { inputTokens: 0, outputTokens: 0 },
        {
          fileName: req.file?.originalname,
          fileSize: req.file?.size,
          processingTime,
          success: false,
          errorMessage: error.message
        }
      );
    }

    // Handle specific errors
    if (error.message && error.message.includes('file size')) {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 32MB.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'AI service is currently busy. Please try again in a moment.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to parse PDF resume. Please try again.'
    });
  }
});

// Get user usage statistics
router.get('/usage-stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthUsage = user.aiUsageStats?.monthlyUsage?.find(m => m.month === currentMonth) || {
      tokens: 0,
      cost: 0,
      operations: 0
    };

    // Calculate usage percentages
    const monthlyTokenPercentage = user.usageLimits?.monthlyTokenLimit ? 
      (currentMonthUsage.tokens / user.usageLimits.monthlyTokenLimit) * 100 : 0;
    
    const monthlyCostPercentage = user.usageLimits?.monthlyCostLimit ? 
      (currentMonthUsage.cost / user.usageLimits.monthlyCostLimit) * 100 : 0;

    // Check if approaching limits
    const tokenWarningThreshold = (user.usageLimits?.alertThresholds?.tokenWarning || 0.8) * 100;
    const costWarningThreshold = (user.usageLimits?.alertThresholds?.costWarning || 0.8) * 100;

    const response = {
      success: true,
      data: {
        totalUsage: {
          totalTokensUsed: user.aiUsageStats?.totalTokensUsed || 0,
          totalCostUSD: user.aiUsageStats?.totalCostUSD || 0,
          resumesParsed: user.aiUsageStats?.resumesParsed || 0
        },
        currentMonth: {
          tokens: currentMonthUsage.tokens,
          cost: currentMonthUsage.cost,
          operations: currentMonthUsage.operations,
          month: currentMonth
        },
        limits: {
          monthlyTokenLimit: user.usageLimits?.monthlyTokenLimit || 100000,
          monthlyCostLimit: user.usageLimits?.monthlyCostLimit || 50.0,
          dailyTokenLimit: user.usageLimits?.dailyTokenLimit || 10000,
          dailyCostLimit: user.usageLimits?.dailyCostLimit || 5.0,
          isLimitEnabled: user.usageLimits?.isLimitEnabled !== false
        },
        usage: {
          monthlyTokenPercentage: Math.round(monthlyTokenPercentage * 100) / 100,
          monthlyCostPercentage: Math.round(monthlyCostPercentage * 100) / 100,
          isApproachingTokenLimit: monthlyTokenPercentage >= tokenWarningThreshold,
          isApproachingCostLimit: monthlyCostPercentage >= costWarningThreshold
        },
        billing: {
          plan: user.billing?.plan || 'free',
          nextBillingDate: user.billing?.nextBillingDate
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage statistics'
    });
  }
});

// Health check for AI service
router.get('/health', authenticateToken, async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service not configured'
      });
    }

    res.json({
      success: true,
      message: 'AI service is available'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI service unavailable'
    });
  }
});

module.exports = router;
