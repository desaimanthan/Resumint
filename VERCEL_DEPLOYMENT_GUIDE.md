# Vercel Deployment Guide for Resumint

## Project Structure
This is a full-stack application with:
- **Frontend**: Next.js 15 application in `/frontend` directory
- **Backend**: Express.js API server in `/backend` directory

## Deployment Options

### Option 1: Deploy Frontend and Backend Separately (Recommended)

#### Deploy Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

3. Configure environment variables in Vercel dashboard:
   - Copy all variables from `frontend/.env.local`
   - Set `NEXT_PUBLIC_API_URL` to your backend URL

#### Deploy Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

3. Configure environment variables in Vercel dashboard:
   - Copy all variables from `backend/.env`
   - Ensure database connections are configured for production

### Option 2: Deploy as Monorepo (Alternative)

If you want to deploy both together, use this `vercel.json` configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

## Environment Variables Setup

### Frontend Environment Variables
Create these in Vercel dashboard for frontend deployment:
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

### Backend Environment Variables
Create these in Vercel dashboard for backend deployment:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: Your AWS region
- `S3_BUCKET_NAME`: Your S3 bucket name
- `ANTHROPIC_API_KEY`: Your Anthropic API key

## Troubleshooting

### Common Issues

1. **npm install fails**: 
   - Check package.json for any conflicting dependencies
   - Ensure Node.js version compatibility

2. **Build fails**:
   - Verify all environment variables are set
   - Check for TypeScript errors
   - Ensure all imports are correct

3. **API routes not working**:
   - Verify backend is deployed and accessible
   - Check CORS configuration
   - Ensure API URL is correctly set in frontend

## Post-Deployment Steps

1. **Update API URLs**: After backend deployment, update the frontend's `NEXT_PUBLIC_API_URL` environment variable

2. **Test functionality**: 
   - User authentication
   - Resume creation and editing
   - File uploads
   - Portfolio generation

3. **Configure custom domain** (optional):
   - Add custom domain in Vercel dashboard
   - Update DNS settings

## Current Status

- ✅ Vercel CLI installed and authenticated
- ✅ Project linked to Vercel
- ❌ Deployment failed due to npm install issues
- 🔄 Recommended to deploy frontend and backend separately

## Next Steps

1. Deploy frontend separately: `cd frontend && vercel --prod`
2. Deploy backend separately: `cd backend && vercel --prod`
3. Configure environment variables in Vercel dashboard
4. Update API URLs and test functionality
