const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
supabase.storage.listBuckets().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection test failed:', error);
  } else {
    console.log('Supabase connection successful. Buckets:', data?.map(b => b.name) || []);
  }
}).catch(err => {
  console.error('Supabase connection error:', err);
});

module.exports = { supabase };
