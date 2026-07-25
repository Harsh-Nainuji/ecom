/**
 * Run this once to create the `product-images` storage bucket in Supabase.
 * Usage: node admin/scripts/ensure_product_images_bucket.js
 * (Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env)
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const BUCKET = 'product-images';
  console.log(`Ensuring "${BUCKET}" bucket exists...`);

  const { data: existing, error: getErr } = await supabase.storage.getBucket(BUCKET);
  if (getErr && !getErr.message.toLowerCase().includes('not found')) {
    console.error('Error checking bucket:', getErr.message);
    process.exit(1);
  }

  if (existing) {
    console.log('Bucket already exists. Updating config...');
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    });
    if (error) { console.error('Update error:', error.message); process.exit(1); }
    console.log('✅ Bucket config updated.');
  } else {
    const { data, error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    });
    if (error) { console.error('Create error:', error.message); process.exit(1); }
    console.log('✅ Bucket created:', data.name);
  }

  // Upload smoke test
  const testBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const testPath = `smoke-test/test_${Date.now()}.png`;
  const { data: up, error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(testPath, testBytes, { contentType: 'image/png', upsert: true });
  if (upErr) { console.error('❌ Upload test failed:', upErr.message); process.exit(1); }
  console.log('✅ Upload test passed:', up.path);

  await supabase.storage.from(BUCKET).remove([testPath]);
  console.log('✅ Cleanup passed.');

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl('sample.jpg');
  console.log('✅ Public URL base:', urlData.publicUrl.replace('sample.jpg', ''));
  console.log('\nDone! Product image uploads should work now.');
}

main().catch((err) => { console.error(err); process.exit(1); });
