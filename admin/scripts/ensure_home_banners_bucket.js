const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Ensuring home-banners bucket exists...');

  const { data: existing, error: getErr } = await supabase.storage.getBucket('home-banners');
  if (getErr && getErr.message !== 'Bucket not found') {
    console.error('Error checking bucket:', getErr.message);
    process.exit(1);
  }

  if (existing) {
    console.log('Bucket already exists. Updating config...');
    const { error: updateErr } = await supabase.storage.updateBucket('home-banners', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    });
    if (updateErr) console.error('Update error:', updateErr.message);
    else console.log('Bucket updated.');
  } else {
    const { data, error } = await supabase.storage.createBucket('home-banners', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    });
    if (error) {
      console.error('Create bucket error:', error.message);
      process.exit(1);
    }
    console.log('Bucket created:', data.name);
  }

  // Quick upload test with a 1x1 transparent PNG
  const testImage = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5TkSuQmCC',
    'base64'
  );
  const fileName = `smoke-${Date.now()}.png`;
  const { data: upload, error: uploadErr } = await supabase.storage
    .from('home-banners')
    .upload(fileName, testImage, { contentType: 'image/png', upsert: false });
  if (uploadErr) {
    console.error('Upload test failed:', uploadErr.message);
    process.exit(1);
  }
  console.log('Upload test passed:', upload.path);

  // Clean up test object
  const { error: removeErr } = await supabase.storage.from('home-banners').remove([upload.path]);
  if (removeErr) console.warn('Remove test warning:', removeErr.message);
  else console.log('Remove test passed.');

  // Public URL sanity check
  const { data: publicUrlData } = supabase.storage.from('home-banners').getPublicUrl(fileName);
  console.log('Public URL pattern:', publicUrlData.publicUrl.split('?')[0]);
}

main().catch((err) => { console.error(err); process.exit(1); });
