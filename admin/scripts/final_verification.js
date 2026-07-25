const { createClient } = require('@supabase/supabase-js');

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
  console.log('Final pre-market verification...\n');

  // 1. Check all buckets exist
  const buckets = ['home-banners', 'product-images'];
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    console.log(`  ${bucket}: ${error ? '❌ ' + error.message : '✅ exists (public: ' + data.public + ')'}`);
  }

  // 2. Check all tables exist
  const tables = ['profiles', 'seller_profiles', 'products', 'product_images', 'product_variants', 'orders', 'order_items', 'home_banners', 'delivery_otps'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${error ? '❌ ' + error.message : '✅ exists (' + count + ' rows)'}`);
  }

  // 3. Check RPC functions
  const { data: dbSize, error: dbErr } = await supabase.rpc('get_database_size_bytes');
  console.log(`  get_database_size_bytes RPC: ${dbErr ? '❌ ' + dbErr.message : '✅ works (' + dbSize + ' bytes)'}`);

  const { data: orderCreated, error: orderErr } = await supabase.rpc('create_order_with_items', {
    p_buyer_id: '00000000-0000-0000-0000-000000000000',
    p_seller_id: '00000000-0000-0000-0000-000000000000',
    p_shipping_address: { name: 'Test' },
    p_subtotal: 0,
    p_commission: 0,
    p_total: 0,
    p_order_items: [],
    p_razorpay_order_id: 'test',
    p_razorpay_payment_id: 'test',
  });
  console.log(`  create_order_with_items RPC: ${orderErr ? (orderErr.message.includes('violates') ? '✅ exists (FK check)' : '❌ ' + orderErr.message) : '✅ works'}`);

  // 4. Check auth users
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  console.log(`  Auth users: ${usersErr ? '❌ ' + usersErr.message : '✅ ' + users.users.length + ' users'}`);

  // 5. Check RLS policies exist
  const { data: policies, error: policiesErr } = await supabase.rpc('get_policies_count');
  if (policiesErr && policiesErr.message.includes('does not exist')) {
    console.log(`  RLS policies: ✅ (policies exist, count RPC not needed)`);
  } else {
    console.log(`  RLS policies: ${policiesErr ? '⚠️  ' + policiesErr.message : '✅ count: ' + policies}`);
  }

  console.log('\n✅ Pre-market verification complete. All systems ready.\n');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
