# S3 Setup Guide for Supabase Storage

This guide will help you set up S3 access for Supabase Storage to enable profile picture uploads.

## Step 1: Enable S3 Connection in Supabase

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage** → **Settings** → **S3 Connection**
3. **Enable S3 Connection** by toggling the switch
4. **Copy the S3 details**:
   - Endpoint URL
   - Region
   - Access Key ID (you'll need to create this)
   - Secret Access Key (you'll need to create this)

## Step 2: Create S3 Access Keys

1. **In Supabase Dashboard**, go to **Storage** → **Settings** → **S3 Connection**
2. **Click "New access key"**
3. **Enter a description** (e.g., "Profile Pictures Upload")
4. **Click "Create access key"**
5. **Copy both the Access Key ID and Secret Access Key** (you won't see the secret again!)

## Step 3: Create the Profile Pictures Bucket

1. **Go to Storage** → **Buckets**
2. **Click "New bucket"**
3. **Enter bucket name**: `profile-pictures`
4. **Set as Public bucket** ✅
5. **Click "Create bucket"**

## Step 4: Update Environment Variables

Update your `.env` file with the S3 credentials:

```env
# S3 Configuration (Supabase Storage via S3 Protocol)
S3_ENDPOINT=https://
.supabase.co/storage/v1/s3
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=your-actual-access-key-id
S3_SECRET_ACCESS_KEY=your-actual-secret-access-key
```

**Replace the placeholders with your actual values:**
- `your-project-ref` → Your Supabase project reference ID
- `your-actual-access-key-id` → The Access Key ID you created
- `your-actual-secret-access-key` → The Secret Access Key you created

## Step 5: Test the Connection

1. **Restart your backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Check the console output** for S3 connection status:
   ```
   Testing S3 connection...
   S3 Endpoint: https://your-project.supabase.co/storage/v1/s3
   S3 Region: ap-south-1
   S3 Access Key: Set
   S3 Secret Key: Set
   ✅ S3 connection successful
   Available buckets: ['profile-pictures']
   ✅ profile-pictures bucket found
   ```

3. **Test profile picture upload** in your application

## Step 6: Verify Upload Works

1. **Go to your application**
2. **Navigate to Account page**
3. **Try uploading a profile picture**
4. **Check the backend console** for upload logs:
   ```
   Uploading profile picture via S3...
   File path: user-12345/avatar.jpg
   File size: 123456
   Content type: image/jpeg
   S3 upload successful: https://your-project.supabase.co/storage/v1/object/public/profile-pictures/user-12345/avatar.jpg
   ```

## Troubleshooting

### Issue: "S3 credentials not configured"
- **Solution**: Make sure all S3 environment variables are set in `.env`
- **Check**: Restart the backend server after updating `.env`

### Issue: "Access Denied" or "Invalid credentials"
- **Solution**: Verify your Access Key ID and Secret Access Key are correct
- **Check**: Make sure you copied the keys correctly (no extra spaces)

### Issue: "Bucket not found"
- **Solution**: Create the `profile-pictures` bucket in Supabase Dashboard
- **Check**: Make sure the bucket name is exactly `profile-pictures`

### Issue: "Connection failed"
- **Solution**: Check your S3 endpoint URL
- **Format**: `https://your-project-ref.supabase.co/storage/v1/s3`

## Security Notes

- **Keep your S3 credentials secure** - never commit them to version control
- **Use environment variables** for all sensitive configuration
- **The bucket is public** to allow profile picture display
- **Files are organized by user ID** to prevent conflicts
- **Old profile pictures are automatically replaced** when new ones are uploaded

## Benefits of S3 Protocol

- ✅ **More reliable** than Supabase Storage API
- ✅ **Better error handling** and debugging
- ✅ **Standard S3 interface** - familiar to developers
- ✅ **No RLS issues** - direct S3 access
- ✅ **Better performance** for file operations
