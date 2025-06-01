# Supabase Storage Debugging Guide

## Step 0: Enable Storage in Supabase (IMPORTANT!)

**If `storage.buckets` table doesn't exist, Storage is not enabled:**

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. If you see a setup screen, click **"Enable Storage"** or **"Get Started"**
4. This will create the necessary storage tables and infrastructure
5. After enabling, you should see the Storage interface

**Alternative method:**
1. Go to **Database** → **SQL Editor**
2. Run this command to enable storage:
```sql
-- Enable storage extension
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";
```

## Step 1: Run the Debug Script

First, run the debug script to test your Supabase connection:

```bash
cd backend
node debug-supabase.js
```

This will test:
- Environment variables loading
- Bucket listing permissions
- Specific bucket access
- Bucket info retrieval
- Authentication status

## Step 2: Common Issues and Solutions

### Issue 1: Empty Buckets Array `[]`

**Possible Causes:**
1. **RLS (Row Level Security) enabled on storage.buckets table**
2. **Incorrect API key permissions**
3. **Project URL mismatch**

**Solutions:**

#### A. Check RLS Policies in Supabase Dashboard
1. Go to **Database** → **Tables**
2. Find `storage.buckets` table
3. Click on **RLS** tab
4. If RLS is enabled, you need to create a policy or disable it

**To disable RLS (for development):**
```sql
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
```

**Or create a policy to allow anon access:**
```sql
CREATE POLICY "Allow anon to view buckets" ON storage.buckets
FOR SELECT TO anon
USING (true);
```

#### B. Verify API Keys
1. Go to **Settings** → **API**
2. Copy the **anon/public** key (not the service_role key)
3. Make sure it matches your `.env` file

#### C. Check Project URL
1. Go to **Settings** → **General**
2. Copy the **Reference ID** 
3. Your URL should be: `https://[reference-id].supabase.co`

### Issue 2: Bucket Access Denied

**Possible Causes:**
1. **RLS enabled on storage.objects table**
2. **Bucket policies restricting access**

**Solutions:**

#### A. Check storage.objects RLS
```sql
-- Disable RLS on objects table (for development)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Or create policies for anon access
CREATE POLICY "Allow anon to view objects" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Allow anon to insert objects" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Allow anon to update objects" ON storage.objects
FOR UPDATE TO anon
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Allow anon to delete objects" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'profile-pictures');
```

#### B. Check Bucket Policies
1. Go to **Storage** → **Policies**
2. Make sure there are appropriate policies for your bucket

### Issue 3: Authentication Required

If you see authentication errors, you might need to:

1. **Use service role key** (for server-side operations):
   - Go to **Settings** → **API**
   - Copy the **service_role** key
   - Add it to your `.env` as `SUPABASE_SERVICE_KEY`
   - Update your backend to use service key for storage operations

2. **Or configure proper RLS policies** as shown above

## Step 3: Quick Fix for Development

For development purposes, you can quickly disable RLS on storage tables:

```sql
-- Run these in your Supabase SQL Editor
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** Only do this for development. For production, use proper RLS policies.

## Step 4: Test Upload

After fixing the issues, test the upload:

1. Restart your backend server
2. Try uploading a profile picture
3. Check the console logs for success messages

## Step 5: Production Setup

For production, enable RLS and create proper policies:

```sql
-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view buckets" ON storage.buckets
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own profile pictures" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Need Help?

If you're still having issues, share the output of the debug script and we can troubleshoot further!
