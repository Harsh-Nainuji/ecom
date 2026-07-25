const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Identifying demo users (@fabzone.dev or containing "demo")...');
  const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;

  const demoUsers = usersData.users.filter(
    (u) => (u.email && (u.email.endsWith('@fabzone.dev') || u.email.includes('demo')))
  );
  const demoIds = demoUsers.map((u) => u.id);
  console.log(`Found ${demoUsers.length} demo users:`);
  for (const u of demoUsers) console.log(`  - ${u.email} (${u.id})`);

  if (demoIds.length === 0) {
    console.log('No demo users found. Nothing to clean.');
    return;
  }

  // Helper for deletions
  const del = async (table, inColumn = 'id') => {
    const { error } = await supabase.from(table).delete().in(inColumn, demoIds);
    if (error) {
      console.log(`  ${table}: ERROR ${error.message}`);
    } else {
      console.log(`  ${table}: deleted rows for demo users`);
    }
  };

  const delIn = async (table, column, ids) => {
    if (!ids.length) return;
    const { error } = await supabase.from(table).delete().in(column, ids);
    if (error) console.log(`  ${table}: ERROR ${error.message}`);
    else console.log(`  ${table}: deleted ${ids.length} rows`);
  };

  // Find products owned by demo sellers so we can clean dependent rows accurately.
  const { data: demoProducts, error: prodErr } = await supabase
    .from('products')
    .select('id')
    .in('seller_id', demoIds);
  if (prodErr) console.log('  products lookup:', prodErr.message);
  const demoProductIds = (demoProducts ?? []).map((p) => p.id);

  const { data: demoOrders, error: orderErr } = await supabase
    .from('orders')
    .select('id')
    .or(`buyer_id.in.(${demoIds.join(',')}),seller_id.in.(${demoIds.join(',')}),delivery_partner_id.in.(${demoIds.join(',')})`);
  if (orderErr) console.log('  orders lookup:', orderErr.message);
  const demoOrderIds = (demoOrders ?? []).map((o) => o.id);

  // Delete child rows first
  console.log('Cleaning related records...');
  if (demoOrderIds.length) {
    await delIn('order_items', 'order_id', demoOrderIds);
    await delIn('delivery_otps', 'order_id', demoOrderIds);
    await delIn('reviews', 'order_id', demoOrderIds);
    await supabase.from('orders').delete().in('id', demoOrderIds).then(r => r.error && console.log('  orders:', r.error.message));
  }
  if (demoProductIds.length) {
    await supabase.from('product_images').delete().in('product_id', demoProductIds).then(r => r.error && console.log('  product_images:', r.error.message));
    await supabase.from('product_variants').delete().in('product_id', demoProductIds).then(r => r.error && console.log('  product_variants:', r.error.message));
    await supabase.from('sponsored_listings').delete().in('product_id', demoProductIds).then(r => r.error && console.log('  sponsored_listings:', r.error.message));
    await supabase.from('products').delete().in('id', demoProductIds).then(r => r.error && console.log('  products:', r.error.message));
  }

  await del('cart_items', 'buyer_id');
  await del('wishlists', 'buyer_id');
  await del('addresses', 'buyer_id');
  await del('seller_profiles');
  await del('delivery_accounts');

  // Finally demo profiles and auth users
  const { error: profileDelErr } = await supabase.from('profiles').delete().in('id', demoIds);
  if (profileDelErr) console.log('  profiles:', profileDelErr.message);
  else console.log('  profiles: deleted demo rows');

  console.log('Deleting demo auth users...');
  for (const u of demoUsers) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.log(`  FAILED ${u.email}: ${error.message}`);
    else console.log(`  DELETED ${u.email}`);
  }

  console.log('Cleanup complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
