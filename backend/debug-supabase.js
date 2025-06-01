require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('=== Supabase Debug Script ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupabase() {
  console.log('\n=== Testing Supabase Connection ===');
  
  try {
    // Test 1: List buckets
    console.log('1. Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Bucket listing failed:', bucketsError);
    } else {
      console.log('✅ Bucket listing successful');
      console.log('Available buckets:', buckets?.map(b => ({
        name: b.name,
        id: b.id,
        public: b.public,
        created_at: b.created_at
      })) || []);
    }

    // Test 2: Try to access profile-pictures bucket specifically
    console.log('\n2. Testing profile-pictures bucket access...');
    const { data: files, error: filesError } = await supabase.storage
      .from('profile-pictures')
      .list('', { limit: 1 });
    
    if (filesError) {
      console.error('❌ Profile-pictures bucket access failed:', filesError);
    } else {
      console.log('✅ Profile-pictures bucket accessible');
      console.log('Files in root:', files?.length || 0);
    }

    // Test 3: Try to get bucket info
    console.log('\n3. Testing bucket info retrieval...');
    const { data: bucketInfo, error: bucketInfoError } = await supabase.storage
      .getBucket('profile-pictures');
    
    if (bucketInfoError) {
      console.error('❌ Bucket info retrieval failed:', bucketInfoError);
    } else {
      console.log('✅ Bucket info retrieved successfully');
      console.log('Bucket details:', bucketInfo);
    }

    // Test 4: Test auth status
    console.log('\n4. Testing auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (expected with anon key):', authError.message);
    } else {
      console.log('User:', user);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugSupabase().then(() => {
  console.log('\n=== Debug Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
