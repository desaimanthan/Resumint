# Supabase Storage Setup for Profile Pictures

To enable profile picture uploads, you need to create a storage bucket in your Supabase project.

## Steps to Create the Storage Bucket

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click on "Buckets" tab

3. **Create New Bucket**
   - Click "New bucket" button
   - Enter bucket name: `profile-pictures`
   - Set as **Public bucket** (check the box)
   - Click "Create bucket"

4. **Configure Bucket Policies (Optional)**
   - Click on the `profile-pictures` bucket
   - Go to "Policies" tab
   - You can set up Row Level Security (RLS) policies if needed

## Bucket Configuration Details

- **Bucket Name**: `profile-pictures`
- **Public Access**: Yes (required for displaying profile pictures)
- **File Types**: JPEG, PNG, WebP
- **Max File Size**: 5MB (enforced by application)
- **File Structure**: `user-{userId}/avatar.{extension}`

## Verification

Once the bucket is created, profile picture uploads should work automatically. The application will:

1. Check if the bucket exists
2. Upload files to the bucket
3. Store the public URL in the user's profile
4. Display the profile picture in the UI

## Troubleshooting

If you encounter issues:

1. **Bucket not found**: Ensure the bucket name is exactly `profile-pictures`
2. **Upload fails**: Check that the bucket is set to public
3. **Images don't display**: Verify the bucket's public access settings

## Security Notes

- The bucket is public to allow profile picture display
- Files are organized by user ID to prevent conflicts
- File size and type validation is handled by the application
- Old profile pictures are automatically replaced when new ones are uploaded
