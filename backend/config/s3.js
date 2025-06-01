const AWS = require('aws-sdk');

// Configure AWS S3 for Supabase Storage
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT, // Supabase S3 endpoint
  region: process.env.S3_REGION || 'ap-south-1',
  s3ForcePathStyle: true, // Required for Supabase S3
  signatureVersion: 'v4'
});

// Test S3 connection
const testS3Connection = async () => {
  try {
    console.log('Testing S3 connection...');
    console.log('S3 Endpoint:', process.env.S3_ENDPOINT);
    console.log('S3 Region:', process.env.S3_REGION || 'ap-south-1');
    console.log('S3 Access Key:', process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Missing');
    console.log('S3 Secret Key:', process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Missing');

    // List buckets to test connection
    const buckets = await s3.listBuckets().promise();
    console.log('✅ S3 connection successful');
    console.log('Available buckets:', buckets.Buckets.map(b => b.Name));
    
    // Check if profile-pictures bucket exists
    const bucketExists = buckets.Buckets.some(bucket => bucket.Name === 'profile-pictures');
    if (bucketExists) {
      console.log('✅ profile-pictures bucket found');
    } else {
      console.log('⚠️  profile-pictures bucket not found');
    }
  } catch (error) {
    console.error('❌ S3 connection failed:', error.message);
  }
};

// Upload file to S3
const uploadToS3 = async (bucketName, key, buffer, contentType) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read', // Make file publicly accessible
    CacheControl: 'max-age=3600'
  };

  try {
    const result = await s3.upload(params).promise();
    
    // Convert S3 URL to Supabase public URL
    const supabaseUrl = process.env.SUPABASE_URL;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${key}`;
    
    console.log('S3 upload result URL:', result.Location);
    console.log('Converted to public URL:', publicUrl);
    
    return {
      success: true,
      url: publicUrl, // Use public URL instead of S3 URL
      key: result.Key
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

// Delete file from S3
const deleteFromS3 = async (bucketName, key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
};

// List files in S3 bucket
const listS3Files = async (bucketName, prefix = '') => {
  const params = {
    Bucket: bucketName,
    Prefix: prefix
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    return {
      success: true,
      files: result.Contents || []
    };
  } catch (error) {
    console.error('S3 list error:', error);
    throw error;
  }
};

// Initialize S3 connection test
if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_ENDPOINT) {
  testS3Connection();
} else {
  console.log('⚠️  S3 credentials not configured. Profile picture uploads will not work.');
}

module.exports = {
  s3,
  uploadToS3,
  deleteFromS3,
  listS3Files,
  testS3Connection
};
