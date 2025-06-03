const express = require('express');
const router = express.Router();
const CoverLetter = require('../models/CoverLetter');
const Resume = require('../models/Resume');
const AIUsageLog = require('../models/AIUsageLog');
const { authenticateToken } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const puppeteer = require('puppeteer');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get all cover letters for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const coverLetters = await CoverLetter.find({ userId: req.user.id })
      .populate('resumeId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        coverLetters
      }
    });
  } catch (error) {
    console.error('Error fetching cover letters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cover letters'
    });
  }
});

// Get a specific cover letter
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const coverLetter = await CoverLetter.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('resumeId', 'title');

    if (!coverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Cover letter not found'
      });
    }

    res.json({
      success: true,
      data: {
        coverLetter
      }
    });
  } catch (error) {
    console.error('Error fetching cover letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cover letter'
    });
  }
});

// Download cover letter as PDF
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const coverLetter = await CoverLetter.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('resumeId', 'title personalInfo');

    if (!coverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Cover letter not found'
      });
    }

    if (!coverLetter.generatedContent) {
      return res.status(400).json({
        success: false,
        message: 'Cover letter has not been generated yet'
      });
    }

    // Helper function to safely escape HTML content
    const escapeHtml = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Safely extract and escape content
    const safeTitle = escapeHtml(coverLetter.title);
    const safeName = escapeHtml(coverLetter.resumeId?.personalInfo?.fullName || 'Your Name');
    const safeEmail = escapeHtml(coverLetter.resumeId?.personalInfo?.email || '');
    const safePhone = escapeHtml(coverLetter.resumeId?.personalInfo?.phone || '');
    const safeLocation = escapeHtml(coverLetter.resumeId?.personalInfo?.location || '');
    const safeContent = escapeHtml(coverLetter.generatedContent || '');

    // Create HTML content for PDF
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 2em;
      border-bottom: 2px solid #333;
      padding-bottom: 1em;
    }
    .name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 0.5em;
    }
    .contact-info {
      font-size: 14px;
      color: #666;
    }
    .date {
      text-align: right;
      margin-bottom: 2em;
      font-size: 14px;
    }
    .content {
      font-size: 12px;
      text-align: justify;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 3em;
      text-align: right;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${safeName}</div>
    <div class="contact-info">
      ${safeEmail}
      ${safePhone ? ' • ' + safePhone : ''}
      ${safeLocation ? ' • ' + safeLocation : ''}
    </div>
  </div>
  
  <div class="date">
    ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
  
  <div class="content">
    ${safeContent}
  </div>
</body>
</html>`;

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Set content with proper encoding
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();

    // Set response headers for PDF download
    const filename = `${coverLetter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.end(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF'
    });
  }
});

// Create a new cover letter (just the initial record)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Create initial cover letter record
    const coverLetter = new CoverLetter({
      userId: req.user.id,
      title,
      isDraft: true
    });

    await coverLetter.save();

    res.json({
      success: true,
      data: {
        coverLetter
      }
    });
  } catch (error) {
    console.error('Error creating cover letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cover letter'
    });
  }
});

// Generate cover letter with AI
router.post('/:id/generate', authenticateToken, async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and job description are required'
      });
    }

    // Get the cover letter
    const coverLetter = await CoverLetter.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!coverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Cover letter not found'
      });
    }

    // Get the resume data
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Prepare resume data for AI
    const resumeData = {
      personalInfo: resume.personalInfo,
      summary: resume.summary,
      workHistory: resume.workHistory,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
      additionalSections: resume.additionalSections
    };

    // System prompt for cover letter generation and analysis
    const systemPrompt = `You are an expert career counselor and cover letter writer. Your task is to:

1. Generate a professional, compelling cover letter based on the provided resume and job description
2. Analyze how well the candidate's profile fits the job requirements
3. Provide detailed scoring and recommendations

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

Please respond with this exact JSON structure:
{
  "coverLetter": "The complete cover letter text",
  "analysis": {
    "fitScore": number (1-10, overall fit for the role),
    "skillsMatch": number (1-10, how well skills align),
    "experienceRelevance": number (1-10, how relevant experience is),
    "educationFit": number (1-10, how well education matches),
    "overallStrengths": ["strength1", "strength2", "strength3"],
    "areasForImprovement": ["area1", "area2", "area3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
  }
}

Guidelines:
- Cover letter should be professional, engaging, and tailored to the specific role
- Include specific examples from the resume that match job requirements
- Keep cover letter concise (3-4 paragraphs)
- Scoring should be realistic and helpful
- Provide actionable recommendations for improvement
- Ensure all strings are properly escaped for JSON`;

    const userPrompt = `Resume Data:
${JSON.stringify(resumeData, null, 2)}

Job Description:
${jobDescription}

Please generate a cover letter and provide analysis as specified. Remember to respond with ONLY valid JSON.`;

    // Make API call to Anthropic
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 10000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Parse the AI response with improved error handling
    let aiResult;
    try {
      // Get the raw response text
      let responseText = response.content[0].text.trim();
      
      // Log the raw response for debugging
      console.log('Raw AI response length:', responseText.length);
      console.log('Raw AI response first 200 chars:', responseText.substring(0, 200));
      
      // Remove any markdown code blocks if present
      responseText = responseText.replace(/```json\n?|```\n?/g, '').trim();
      
      // Remove control characters that can break JSON parsing
      responseText = responseText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Try to find JSON object boundaries
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('Cleaned AI response length:', responseText.length);
      console.log('Cleaned AI response first 200 chars:', responseText.substring(0, 200));
      
      aiResult = JSON.parse(responseText);
      
      // Validate the structure
      if (!aiResult.coverLetter || !aiResult.analysis) {
        throw new Error('Invalid response structure');
      }
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', response.content[0].text);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI response. Please try again.'
      });
    }

    // Calculate cost (approximate)
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    
    // Claude 3.5 Sonnet pricing (approximate)
    const inputCostPer1K = 0.003; // $3 per 1M tokens
    const outputCostPer1K = 0.015; // $15 per 1M tokens
    
    const inputCost = (inputTokens / 1000) * inputCostPer1K;
    const outputCost = (outputTokens / 1000) * outputCostPer1K;
    const totalCost = inputCost + outputCost;

    // Log AI usage
    const aiUsageLog = new AIUsageLog({
      userId: req.user.id,
      resumeId: resumeId,
      operation: 'enhancement', // closest match to cover letter generation
      model: 'claude-3-7-sonnet-20250219',
      inputTokens,
      outputTokens,
      totalTokens,
      cost: totalCost,
      metadata: {
        processingTime: responseTime,
        success: true,
        coverLetterId: coverLetter._id,
        jobDescriptionLength: jobDescription.length
      }
    });

    await aiUsageLog.save();

    // Update cover letter with generated content
    coverLetter.resumeId = resumeId;
    coverLetter.jobDescription = jobDescription;
    coverLetter.generatedContent = aiResult.coverLetter;
    coverLetter.fitScore = aiResult.analysis.fitScore;
    coverLetter.analysis = aiResult.analysis;
    coverLetter.isDraft = false;

    await coverLetter.save();

    res.json({
      success: true,
      data: {
        coverLetter,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          costUSD: totalCost
        }
      }
    });

  } catch (error) {
    console.error('Error generating cover letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cover letter'
    });
  }
});

// Delete a cover letter
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const coverLetter = await CoverLetter.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!coverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Cover letter not found'
      });
    }

    res.json({
      success: true,
      message: 'Cover letter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cover letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cover letter'
    });
  }
});

// Duplicate a cover letter
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const originalCoverLetter = await CoverLetter.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!originalCoverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Cover letter not found'
      });
    }

    const duplicatedCoverLetter = new CoverLetter({
      userId: req.user.id,
      title: `${originalCoverLetter.title} (Copy)`,
      resumeId: originalCoverLetter.resumeId,
      jobDescription: originalCoverLetter.jobDescription,
      generatedContent: originalCoverLetter.generatedContent,
      fitScore: originalCoverLetter.fitScore,
      analysis: originalCoverLetter.analysis,
      isDraft: originalCoverLetter.isDraft
    });

    await duplicatedCoverLetter.save();

    res.json({
      success: true,
      data: {
        coverLetter: duplicatedCoverLetter
      }
    });
  } catch (error) {
    console.error('Error duplicating cover letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate cover letter'
    });
  }
});

module.exports = router;
