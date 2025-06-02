# Claude AI Integration Setup Guide

This guide will help you set up the Claude AI integration for the resume builder's AI Summary Assistant feature.

## Prerequisites

1. An Anthropic account with API access
2. A valid Claude API key

## Getting Your Claude API Key

1. **Sign up for Anthropic Console**
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Create an account or sign in

2. **Get API Access**
   - Navigate to the API Keys section
   - Create a new API key
   - Copy the key (it starts with `sk-ant-`)

## Configuration

### Backend Environment Variables

1. **Update Backend .env File**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Edit the .env file
   nano .env  # or use your preferred editor
   ```

2. **Add Your Claude API Key**
   ```env
   # Claude AI
   ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
   ```

3. **Restart the Backend Server**
   ```bash
   # If running in development
   npm run dev
   
   # Or if running with node
   node server.js
   ```

## Testing the Integration

### 1. Health Check

Test if the AI service is properly configured:

```bash
# Make sure you're authenticated and have a valid JWT token
curl -X GET http://localhost:5001/api/ai/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "AI service is available"
}
```

### 2. Generate Summary Test

Test the summary generation endpoint:

```bash
curl -X POST http://localhost:5001/api/ai/generate-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "keywords": "Senior Software Engineer, React, Node.js, 5 years",
    "resumeId": "your-resume-id"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "summary": "Senior software engineer with 5+ years of experience...",
    "keywords": "Senior Software Engineer, React, Node.js, 5 years"
  }
}
```

## How It Works

### System Prompt

The AI uses a carefully crafted system prompt that instructs Claude to:

1. **Keep summaries concise**: 2-3 sentences maximum
2. **Include key elements**: Job title, experience, achievements, skills
3. **Use action-oriented language**: Strong verbs and confident tone
4. **Make it ATS-friendly**: Include relevant keywords
5. **Focus on value proposition**: What the candidate brings to employers

### Context Integration

The AI system intelligently uses existing resume data to create more personalized summaries:

- **Personal Information**: Name and contact details
- **Work History**: Recent job titles, companies, responsibilities, achievements
- **Skills**: Technical and soft skills
- **Education**: Degrees and institutions

### Error Handling

The system includes comprehensive error handling for:

- **API Key Issues**: Configuration errors
- **Rate Limiting**: Too many requests
- **Network Issues**: Connection problems
- **Invalid Responses**: Malformed or inappropriate content

## Usage in the Resume Builder

### For Users

1. **Navigate to Summary Step**: Go to step 6 in the resume builder
2. **Enter Keywords**: Type relevant keywords about your role and experience
3. **Generate Summary**: Click "Generate Summary" button
4. **Edit and Customize**: Modify the generated text to match your style
5. **Save**: The summary is automatically saved to your resume

### Example Keywords

Good keyword examples:
- `"Senior UI/UX Designer, Fintech, Mobile Apps"`
- `"Full-stack Developer, React, Node.js, 3 years"`
- `"Product Manager, B2B SaaS, Team Leadership"`
- `"Marketing Manager, Digital Marketing, E-commerce"`
- `"Data Scientist, Machine Learning, Python"`

## API Rate Limits

Claude API has rate limits. The current implementation uses:
- **Model**: `claude-3-haiku-20240307` (fast and cost-effective)
- **Max Tokens**: 200 (sufficient for summaries)
- **Timeout**: Reasonable timeout for user experience

## Cost Considerations

- Claude Haiku is the most cost-effective model
- Each summary generation costs approximately $0.001-0.002
- Consider implementing usage limits for production

## Troubleshooting

### Common Issues

1. **"AI service configuration error"**
   - Check if `ANTHROPIC_API_KEY` is set in backend/.env
   - Verify the API key is valid and active

2. **"AI service is currently busy"**
   - Rate limit exceeded, wait a moment and try again
   - Consider implementing retry logic

3. **"Failed to generate summary"**
   - Check network connectivity
   - Verify backend server is running
   - Check server logs for detailed error messages

### Debug Mode

Enable debug logging in the backend:

```javascript
// In backend/routes/ai.js, add more detailed logging
console.log('API Key configured:', !!process.env.ANTHROPIC_API_KEY);
console.log('Request payload:', { keywords, resumeId });
```

## Security Best Practices

1. **Never expose API keys in frontend code**
2. **Use environment variables for configuration**
3. **Implement rate limiting on your endpoints**
4. **Validate and sanitize user inputs**
5. **Log API usage for monitoring**

## Production Deployment

### Environment Variables

Make sure to set the environment variable in your production environment:

```bash
# For Docker
ENV ANTHROPIC_API_KEY=sk-ant-your-production-key

# For Heroku
heroku config:set ANTHROPIC_API_KEY=sk-ant-your-production-key

# For AWS/other cloud providers
# Set through their respective environment variable systems
```

### Monitoring

Consider implementing:
- API usage tracking
- Error rate monitoring
- Response time metrics
- Cost tracking

## Support

If you encounter issues:

1. Check the [Anthropic Documentation](https://docs.anthropic.com)
2. Review the error logs in your backend console
3. Test the API key directly using Anthropic's API
4. Ensure all dependencies are properly installed

## Example Generated Summaries

Here are examples of what the AI generates for different keywords:

**Input**: `"Senior UI/UX Designer, Fintech, Mobile Apps"`
**Output**: `"Senior UI/UX designer with expertise in fintech and mobile applications. Passionate about creating user-centered designs that drive engagement and deliver exceptional digital experiences across financial technology platforms."`

**Input**: `"Full-stack Developer, React, Node.js, 5 years"`
**Output**: `"Full-stack software engineer with 5+ years building scalable web applications using React and Node.js. Experienced in developing end-to-end solutions and collaborating with cross-functional teams to deliver high-quality software products."`

The AI adapts the tone, structure, and content based on the keywords provided while maintaining professional standards.
