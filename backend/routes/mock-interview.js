const express = require('express');
const router = express.Router();
const MockInterview = require('../models/MockInterview');
const Resume = require('../models/Resume');
const AIUsageLog = require('../models/AIUsageLog');
const { authenticateToken } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get all mock interviews for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const mockInterviews = await MockInterview.find({ userId: req.user.id })
      .populate('resumeId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        mockInterviews
      }
    });
  } catch (error) {
    console.error('Error fetching mock interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mock interviews'
    });
  }
});

// Get a specific mock interview
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const mockInterview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('resumeId', 'title personalInfo');

    if (!mockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    res.json({
      success: true,
      data: {
        mockInterview
      }
    });
  } catch (error) {
    console.error('Error fetching mock interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mock interview'
    });
  }
});

// Create a new mock interview (just the initial record)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Create initial mock interview record
    const mockInterview = new MockInterview({
      userId: req.user.id,
      title,
      status: 'setup'
    });

    await mockInterview.save();

    res.json({
      success: true,
      data: {
        mockInterview
      }
    });
  } catch (error) {
    console.error('Error creating mock interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mock interview'
    });
  }
});

// Generate interview questions with AI
router.post('/:id/generate-questions', authenticateToken, async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required'
      });
    }

    // Get the mock interview
    const mockInterview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    // Get the resume data
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user.id,
      'publication.isPublished': true // Only allow published resumes
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Published resume not found'
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

    // System prompt for question generation
    const systemPrompt = `You are an expert interview coach and HR professional. Your task is to generate exactly 10 tailored interview questions based on the provided resume and job description.

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

Please respond with this exact JSON structure:
{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    ...
    "Question 10 text here"
  ]
}

Guidelines for question generation:
- Create a mix of behavioral (40%), technical (30%), and situational (30%) questions
- Tailor questions to the candidate's experience level and role
- Include questions about specific skills, projects, or experiences mentioned in the resume
- If job description is provided, align questions with the role requirements
- Make questions realistic and commonly asked in interviews
- Ensure questions are clear, specific, and allow for detailed responses
- Progress from easier to more challenging questions
- Include at least one question about career goals or motivation
- Ensure all strings are properly escaped for JSON`;

    const userPrompt = `Resume Data:
${JSON.stringify(resumeData, null, 2)}

Job Description:
${jobDescription || 'General interview questions (no specific job description provided)'}

Please generate exactly 10 interview questions tailored to this candidate's profile. Remember to respond with ONLY valid JSON.`;

    // Make API call to Anthropic
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
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

    // Parse the AI response
    let aiResult;
    try {
      let responseText = response.content[0].text.trim();
      
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
      
      aiResult = JSON.parse(responseText);
      
      // Validate the structure
      if (!aiResult.questions || !Array.isArray(aiResult.questions) || aiResult.questions.length !== 10) {
        throw new Error('Invalid response structure - expected 10 questions');
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
      operation: 'mock_interview',
      model: 'claude-3-5-sonnet-20241022',
      inputTokens,
      outputTokens,
      totalTokens,
      cost: totalCost,
      metadata: {
        processingTime: responseTime,
        success: true,
        mockInterviewId: mockInterview._id,
        jobDescriptionLength: jobDescription ? jobDescription.length : 0,
        phase: 'question_generation'
      }
    });

    await aiUsageLog.save();

    // Update mock interview with generated questions
    mockInterview.resumeId = resumeId;
    mockInterview.jobDescription = jobDescription || '';
    mockInterview.questions = aiResult.questions;
    mockInterview.status = 'ready';
    mockInterview.isDraft = false;

    await mockInterview.save();

    res.json({
      success: true,
      data: {
        mockInterview,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          costUSD: totalCost
        }
      }
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview questions'
    });
  }
});

// Start interview session
router.post('/:id/start-session', authenticateToken, async (req, res) => {
  try {
    const mockInterview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    if (!mockInterview.questions || mockInterview.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mock interview has no questions generated yet'
      });
    }

    // Initialize session data
    mockInterview.sessionData = {
      startTime: new Date(),
      currentQuestionIndex: 0,
      transcript: '',
      questionsAsked: []
    };
    mockInterview.status = 'in_progress';

    await mockInterview.save();

    res.json({
      success: true,
      data: {
        mockInterview,
        sessionToken: `session_${mockInterview._id}_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Error starting interview session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start interview session'
    });
  }
});

// Update session transcript (called during interview)
router.patch('/:id/update-transcript', authenticateToken, async (req, res) => {
  try {
    const { transcript, currentQuestionIndex, questionAnswer } = req.body;

    const mockInterview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    if (mockInterview.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Interview session is not active'
      });
    }

    // Update transcript
    if (transcript) {
      mockInterview.sessionData.transcript = transcript;
    }

    // Update current question index
    if (currentQuestionIndex !== undefined) {
      mockInterview.sessionData.currentQuestionIndex = currentQuestionIndex;
    }

    // Add question-answer pair if provided
    if (questionAnswer) {
      mockInterview.sessionData.questionsAsked.push({
        question: questionAnswer.question,
        answer: questionAnswer.answer,
        timestamp: new Date()
      });
    }

    await mockInterview.save();

    res.json({
      success: true,
      data: {
        currentQuestionIndex: mockInterview.sessionData.currentQuestionIndex,
        totalQuestions: mockInterview.questions.length
      }
    });

  } catch (error) {
    console.error('Error updating transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transcript'
    });
  }
});

// End interview session and generate analysis
router.post('/:id/end-session', authenticateToken, async (req, res) => {
  try {
    const { finalTranscript } = req.body;

    const mockInterview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    if (mockInterview.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Interview session is not active'
      });
    }

    // Update session end data
    const endTime = new Date();
    const duration = Math.floor((endTime - mockInterview.sessionData.startTime) / 1000);

    mockInterview.sessionData.endTime = endTime;
    mockInterview.sessionData.duration = duration;
    if (finalTranscript) {
      mockInterview.sessionData.transcript = finalTranscript;
    }

    // Generate analysis using Claude
    const systemPrompt = `You are an expert interview coach and HR professional. Your task is to analyze a mock interview transcript and provide detailed feedback.

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

Please respond with this exact JSON structure:
{
  "analysis": {
    "overallScore": number (1-10, overall interview performance),
    "communicationSkills": number (1-10, clarity, articulation, listening),
    "technicalKnowledge": number (1-10, domain expertise, problem-solving),
    "problemSolving": number (1-10, analytical thinking, approach to challenges),
    "confidence": number (1-10, self-assurance, composure),
    "strengths": ["strength1", "strength2", "strength3"],
    "areasForImprovement": ["area1", "area2", "area3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
    "detailedFeedback": "Comprehensive feedback paragraph analyzing the interview performance"
  }
}

Guidelines for analysis:
- Be constructive and specific in feedback
- Provide actionable recommendations
- Consider both content and delivery
- Highlight specific examples from the transcript
- Be encouraging while identifying areas for growth
- Ensure all strings are properly escaped for JSON`;

    const userPrompt = `Interview Questions:
${mockInterview.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Interview Transcript:
${mockInterview.sessionData.transcript}

Interview Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds

Please analyze this mock interview performance and provide detailed feedback. Remember to respond with ONLY valid JSON.`;

    // Make API call to Anthropic for analysis
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 6000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const analysisTime = Date.now() - startTime;

    // Parse the AI response
    let aiResult;
    try {
      let responseText = response.content[0].text.trim();
      
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
      
      aiResult = JSON.parse(responseText);
      
      // Validate the structure
      if (!aiResult.analysis) {
        throw new Error('Invalid response structure');
      }
      
    } catch (parseError) {
      console.error('Error parsing AI analysis response:', parseError);
      console.error('Raw response:', response.content[0].text);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI analysis. Please try again.'
      });
    }

    // Calculate cost for analysis
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    
    const inputCostPer1K = 0.003;
    const outputCostPer1K = 0.015;
    
    const inputCost = (inputTokens / 1000) * inputCostPer1K;
    const outputCost = (outputTokens / 1000) * outputCostPer1K;
    const totalCost = inputCost + outputCost;

    // Log AI usage for analysis
    const aiUsageLog = new AIUsageLog({
      userId: req.user.id,
      resumeId: mockInterview.resumeId,
      operation: 'mock_interview',
      model: 'claude-3-5-sonnet-20241022',
      inputTokens,
      outputTokens,
      totalTokens,
      cost: totalCost,
      metadata: {
        processingTime: analysisTime,
        success: true,
        mockInterviewId: mockInterview._id,
        transcriptLength: mockInterview.sessionData.transcript.length,
        phase: 'analysis_generation'
      }
    });

    await aiUsageLog.save();

    // Update mock interview with analysis
    mockInterview.analysis = aiResult.analysis;
    mockInterview.status = 'completed';

    await mockInterview.save();

    res.json({
      success: true,
      data: {
        mockInterview,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          costUSD: totalCost
        }
      }
    });

  } catch (error) {
    console.error('Error ending interview session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end interview session and generate analysis'
    });
  }
});

// Get interview report
router.get('/:id/report', authenticateToken, async (req, res) => {
  try {
    const mockInterview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('resumeId', 'title personalInfo');

    if (!mockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    if (mockInterview.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Interview analysis not yet available'
      });
    }

    res.json({
      success: true,
      data: {
        mockInterview
      }
    });

  } catch (error) {
    console.error('Error fetching interview report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview report'
    });
  }
});

// Delete a mock interview
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const mockInterview = await MockInterview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    res.json({
      success: true,
      message: 'Mock interview deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mock interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mock interview'
    });
  }
});

// Duplicate a mock interview
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const originalMockInterview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!originalMockInterview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview not found'
      });
    }

    const duplicatedMockInterview = new MockInterview({
      userId: req.user.id,
      title: `${originalMockInterview.title} (Copy)`,
      resumeId: originalMockInterview.resumeId,
      jobDescription: originalMockInterview.jobDescription,
      questions: originalMockInterview.questions,
      status: originalMockInterview.questions.length > 0 ? 'ready' : 'setup',
      isDraft: originalMockInterview.questions.length === 0
    });

    await duplicatedMockInterview.save();

    res.json({
      success: true,
      data: {
        mockInterview: duplicatedMockInterview
      }
    });
  } catch (error) {
    console.error('Error duplicating mock interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate mock interview'
    });
  }
});

// Get realtime token for voice interview
router.post('/realtime-token', authenticateToken, async (req, res) => {
  try {
    // Return the OpenAI API key for realtime connection
    // In production, you might want to create a temporary token
    const token = process.env.OPENAI_API_KEY;
    
    if (!token) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured'
      });
    }

    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Error getting realtime token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get realtime token'
    });
  }
});

module.exports = router;
