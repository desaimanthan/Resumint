# Vercel Environment Variables Setup Guide

## 🚨 Critical Issue
The frontend is still connecting to `localhost:5001` because environment variables are not set in Vercel's production environment.

## 📋 Required Action: Set Environment Variables in Vercel Dashboard

### Frontend Environment Variables
Go to **Vercel Dashboard → Your Frontend Project → Settings → Environment Variables**

Add these variables for **Production** environment:

```
NEXT_PUBLIC_API_URL=https://resumint-backend.vercel.app/api
NEXT_PUBLIC_SUPABASE_URL=https://ussbeyzpkahkqdtunjlg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc2JleXpwa2Foa3FkdHVuamxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NjkzMTgsImV4cCI6MjA2NDM0NTMxOH0.J-tiY2avEVMUFzq1aIjgJwQ_SQ_dQnAJN0yyRMkjifc
```

### Backend Environment Variables
Go to **Vercel Dashboard → Your Backend Project → Settings → Environment Variables**

Add these variables for **Production** environment:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
SUPABASE_URL=https://ussbeyzpkahkqdtunjlg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name
ANTHROPIC_API_KEY=your_anthropic_api_key
FRONTEND_URL=https://resumint-xi.vercel.app
```

## 🔧 Step-by-Step Instructions

### For Frontend:
1. Go to https://vercel.com/dashboard
2. Find your frontend project (likely named "resumint" or similar)
3. Click on the project
4. Go to **Settings** tab
5. Click **Environment Variables** in the left sidebar
6. Click **Add New**
7. Add each variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://resumint-backend.vercel.app/api`
   - **Environment**: Select **Production**
   - Click **Save**
8. Repeat for the other variables

### For Backend:
1. Find your backend project in Vercel dashboard
2. Follow the same steps but add the backend environment variables
3. **Important**: Copy the values from your `backend/.env` file

## 🚀 After Setting Environment Variables

1. **Redeploy Frontend**: 
   ```bash
   cd frontend && vercel --prod
   ```

2. **Redeploy Backend** (if needed):
   ```bash
   cd backend && vercel --prod
   ```

## 🔍 How to Verify

After redeployment:
1. Open browser developer tools
2. Go to your frontend URL
3. Try to login
4. Check the Network tab - API calls should now go to `https://resumint-backend.vercel.app/api/auth/login`

## 📝 Important Notes

- `.env.local` files are **NOT** deployed to Vercel
- Environment variables must be set in Vercel dashboard for production
- `NEXT_PUBLIC_` prefix is required for client-side environment variables in Next.js
- After adding environment variables, you **MUST** redeploy for changes to take effect

## 🎯 Expected Result

After setting environment variables and redeploying:
- ✅ Frontend will connect to `https://resumint-backend.vercel.app/api`
- ✅ CORS errors will be resolved
- ✅ Login and all API calls will work properly
