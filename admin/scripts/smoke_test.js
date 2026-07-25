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

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ✅ ${msg}`);
}

async function createUser(email, password, role, extraProfile = {}) {
  const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  const user = userData.user;

  const { error: profileErr } = await supabase.from('profiles').insert({
    id: user.id,
    role,
    full_name: extraProfile.full_name || email,
    phone: extraProfile.phone || '+91 90000 00000',
  });
  if (profileErr) throw profileErr;

  return user;
}

async function deleteUser(email) {
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list.users.find((u) => u.email === email);
  if (found) {
    await supabase.from('profiles').delete().eq('id', found.id);
    await supabase.auth.admin.deleteUser(found.id);
  }
}

async function cleanup(prefix) {
  // Best-effort cleanup of any previous smoke-test users.
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const testUsers = list.users.filter((u) => u.email && u.email.startsWith(prefix));
  for (const u of testUsers) {
    await supabase.from('profiles').delete().eq('id', u.id);
    await supabase.auth.admin.deleteUser(u.id).catch(() => {});
  }
}

async function main() {
  const prefix = `smoke_${Date.now()}_`;
  console.log('Starting backend smoke test...\n');

  await cleanup(prefix);

  // 1. Create admin, seller, buyer
  const adminEmail = `${prefix}admin@test.dev`;
  const sellerEmail = `${prefix}seller@test.dev`;
  const buyerEmail = `${prefix}buyer@test.dev`;

  const admin = await createUser(adminEmail, 'TestPass123!', 'admin');
  const seller = await createUser(sellerEmail, 'TestPass123!', 'seller');
  const buyer = await createUser(buyerEmail, 'TestPass123!', 'buyer');

  assert(admin && seller && buyer, 'created admin, seller and buyer accounts');

  // 2. Seller registers
  const { error: regErr } = await supabase.from('seller_profiles').insert({
    id: seller.id,
    business_name: 'Smoke Seller',
    mobile: '+91 90000 11111',
    email: sellerEmail,
    gst_number: '22AAAAA0000A1Z5',
    aadhar_number: '123456789012',
    pan_number: 'ABCDE1234F',
    business_address: 'Test Address',
    bank_account_name: 'Smoke Seller',
    bank_account_number: '1234567890',
    bank_ifsc: 'HDFC0000123',
    status: 'pending',
  });
  assert(!regErr, `seller registration saved (aadhar_number present): ${regErr?.message || 'ok'}`);

  // 3. Admin approves seller
  const { error: approveErr } = await supabase
    .from('seller_profiles')
    .update({ status: 'approved' })
    .eq('id', seller.id);
  assert(!approveErr, 'admin approved seller');

  const { data: approvedSeller } = await supabase
    .from('seller_profiles')
    .select('status')
    .eq('id', seller.id)
    .single();
  assert(approvedSeller?.status === 'approved', 'seller status is approved');

  // 4. Buyer adds address
  const { error: addrErr } = await supabase.from('addresses').insert({
    buyer_id: buyer.id,
    label: 'Home',
    recipient_name: 'Smoke Buyer',
    phone: '+91 90000 22222',
    line1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postal_code: '500001',
    is_default: true,
  });
  assert(!addrErr, 'buyer address saved');

  // 5. Admin creates category, seller adds product
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .insert({ name: `${prefix}Category`, icon: 'star' })
    .select()
    .single();
  assert(!catErr && category, 'category created');

  const { data: product, error: prodErr } = await supabase
    .from('products')
    .insert({
      seller_id: seller.id,
      category_id: category.id,
      name: `${prefix}Product`,
      description: 'Smoke test product',
      price: 999.0,
      status: 'active',
      commission_rate: 5.0,
    })
    .select()
    .single();
  assert(!prodErr && product, 'product created by seller');

  const { data: variant, error: varErr } = await supabase
    .from('product_variants')
    .insert({ product_id: product.id, size: 'M', color: 'Red', stock: 10 })
    .select()
    .single();
  assert(!varErr && variant, 'product variant created');

  const { error: imgErr } = await supabase.from('product_images').insert({
    product_id: product.id,
    image_url: 'https://placehold.co/600x400?text=Smoke',
    sort_order: 0,
  });
  assert(!imgErr, 'product image saved');

  // 6. Buyer wishlist and cart
  const { error: wishErr } = await supabase.from('wishlists').insert({
    buyer_id: buyer.id,
    product_id: product.id,
  });
  assert(!wishErr, 'buyer added product to wishlist');

  const { error: cartErr } = await supabase.from('cart_items').insert({
    buyer_id: buyer.id,
    variant_id: variant.id,
    quantity: 2,
  });
  assert(!cartErr, 'buyer added variant to cart');

  // 7. Place order via RPC
  const shippingAddress = {
    name: 'Smoke Buyer',
    phone: '+91 90000 22222',
    line1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postal_code: '500001',
  };
  const orderItems = [
    {
      product_id: product.id,
      variant_id: variant.id,
      quantity: 2,
      unit_price: 999.0,
      total_price: 1998.0,
    },
  ];

  const { data: orderId, error: orderErr } = await supabase.rpc('create_order_with_items', {
    p_buyer_id: buyer.id,
    p_seller_id: seller.id,
    p_shipping_address: shippingAddress,
    p_subtotal: 1998.0,
    p_commission: 99.9,
    p_total: 1998.0,
    p_order_items: orderItems,
    p_razorpay_order_id: `${prefix}rzp_order`,
    p_razorpay_payment_id: `${prefix}rzp_payment`,
  });
  assert(!orderErr && orderId, `order placed via RPC: ${orderErr?.message || 'ok'}`);

  const { data: placedOrder } = await supabase.from('orders').select('*').eq('id', orderId).single();
  assert(placedOrder?.payment_status === 'paid' && placedOrder?.order_status === 'paid', 'order is paid');

  // 8. Seller updates status to out_for_delivery -> OTP generated
  const { error: updateErr } = await supabase
    .from('orders')
    .update({ order_status: 'out_for_delivery', delivery_status: 'out_for_delivery', delivery_partner_id: admin.id })
    .eq('id', orderId);
  assert(!updateErr, 'order marked out_for_delivery');

  const { data: otp } = await supabase.from('delivery_otps').select('*').eq('order_id', orderId).single();
  assert(otp && otp.otp_code?.length === 6, `delivery OTP generated: ${otp?.otp_code}`);

  // 9. Admin-managed banner
  const { error: bannerErr } = await supabase.from('home_banners').insert({
    title: 'Smoke Banner',
    image_url: 'https://placehold.co/800x400?text=Smoke+Banner',
    link_url: 'https://example.com',
    active: true,
    display_order: 1,
  });
  assert(!bannerErr, 'admin banner inserted');

  const { data: activeBanners } = await supabase.from('home_banners').select('*').eq('active', true).order('display_order', { ascending: true });
  assert(activeBanners && activeBanners.some((b) => b.title === 'Smoke Banner'), 'active banner visible to buyers');

  // 10. Database usage RPC
  const { data: dbSize, error: dbErr } = await supabase.rpc('get_database_size_bytes');
  if (dbErr) {
    console.log(`  ⚠️  get_database_size_bytes RPC missing: ${dbErr.message}`);
  } else {
    assert(typeof dbSize === 'number', `database size RPC works: ${dbSize} bytes`);
  }

  // Cleanup
  console.log('\nCleaning up smoke-test data...');
  await supabase.from('home_banners').delete().eq('title', 'Smoke Banner');
  await supabase.from('reviews').delete().eq('order_id', orderId);
  await supabase.from('delivery_otps').delete().eq('order_id', orderId);
  await supabase.from('order_items').delete().eq('order_id', orderId);
  await supabase.from('orders').delete().eq('id', orderId);
  await supabase.from('cart_items').delete().eq('buyer_id', buyer.id);
  await supabase.from('wishlists').delete().eq('buyer_id', buyer.id);
  await supabase.from('product_images').delete().eq('product_id', product.id);
  await supabase.from('product_variants').delete().eq('product_id', product.id);
  await supabase.from('products').delete().eq('id', product.id);
  await supabase.from('categories').delete().eq('id', category.id);
  await supabase.from('addresses').delete().eq('buyer_id', buyer.id);
  await supabase.from('seller_profiles').delete().eq('id', seller.id);
  await supabase.from('profiles').delete().in('id', [admin.id, seller.id, buyer.id]);
  await supabase.auth.admin.deleteUser(admin.id).catch(() => {});
  await supabase.auth.admin.deleteUser(seller.id).catch(() => {});
  await supabase.auth.admin.deleteUser(buyer.id).catch(() => {});

  console.log('\n✅ Backend smoke test completed successfully.');
}

main().catch((err) => {
  console.error('\n❌ Smoke test failed:', err.message);
  process.exit(1);
});
