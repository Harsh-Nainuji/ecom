const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Environment check for:', url);
  console.log('');

  // 1. Basic connection
  const { count: profileCount, error: profileError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log('profiles table:', profileError ? `ERROR ${profileError.message}` : `OK (${profileCount ?? 0} rows)`);

  // 2. home_banners table
  const { count: bannerCount, error: bannerError } = await supabase
    .from('home_banners')
    .select('*', { count: 'exact', head: true });
  console.log('home_banners table:', bannerError ? `MISSING (${bannerError.message})` : `OK (${bannerCount ?? 0} rows)`);

  // 3. database size RPC
  const { data: dbSize, error: dbSizeError } = await supabase.rpc('get_database_size_bytes');
  console.log('get_database_size_bytes RPC:', dbSizeError ? `MISSING (${dbSizeError.message})` : `OK (${dbSize} bytes)`);

  // 4. Storage bucket
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('home-banners');
  console.log('home-banners bucket:', bucketError ? `MISSING (${bucketError.message})` : `OK (${bucket.public ? 'public' : 'private'})`);

  // 5. Auth users overview
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) {
    console.log('auth users:', `ERROR ${usersError.message}`);
  } else {
    console.log('auth users:', `OK (${users.users.length} users)`);
    for (const u of users.users) {
      console.log('  -', u.email || u.id, `created ${new Date(u.created_at).toISOString()}`);
    }
  }

  console.log('');
  console.log('Check complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
