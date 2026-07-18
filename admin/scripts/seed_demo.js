const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load admin .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
for (const line of env.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in admin/.env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = [
  { email: 'buyer.demo@fabzone.dev', password: 'DemoBuyer1!', role: 'buyer', full_name: 'Ananya Rao', phone: '+91 90000 11111' },
  { email: 'buyer.second@fabzone.dev', password: 'DemoBuyer2!', role: 'buyer', full_name: 'Rahul Mehta', phone: '+91 90000 11112' },
  { email: 'seller.demo@fabzone.dev', password: 'DemoSeller1!', role: 'seller', full_name: 'Ira Collections', phone: '+91 90000 22221' },
  { email: 'seller.handloom@fabzone.dev', password: 'DemoSeller2!', role: 'seller', full_name: 'Handloom Stories', phone: '+91 90000 22222' },
  { email: 'delivery.demo@fabzone.dev', password: 'DemoDelivery1!', role: 'delivery', full_name: 'Swift Runner Logistics', phone: '+91 90000 33333' },
];

const categoryIds = [
  'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
];

const productId1 = 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
const productId2 = 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2';
const productId3 = 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3';

async function cleanup() {
  const emails = demoUsers.map((u) => u.email);
  // List existing users to find ids to delete
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (listErr) throw listErr;
  const toDelete = (list?.users || []).filter((u) => emails.includes(u.email));
  for (const u of toDelete) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.warn('Delete user warning:', u.email, error.message);
    else console.log('Deleted existing user:', u.email);
  }
}

async function seed() {
  const userMap = {};

  for (const u of demoUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, phone: u.phone },
    });
    if (error) {
      console.error('Failed to create', u.email);
      console.error('  name:', error.name);
      console.error('  message:', error.message);
      console.error('  status:', error.status);
      console.error('  code:', error.code);
      console.error('  full:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      process.exit(1);
    }
    userMap[u.email] = data.user;
    console.log('Created user:', u.email, '->', data.user.id);
  }

  const buyer1 = userMap['buyer.demo@fabzone.dev'];
  const buyer2 = userMap['buyer.second@fabzone.dev'];
  const seller1 = userMap['seller.demo@fabzone.dev'];
  const seller2 = userMap['seller.handloom@fabzone.dev'];
  const delivery = userMap['delivery.demo@fabzone.dev'];

  // Profiles
  const { error: profilesErr } = await supabase.from('profiles').upsert([
    { id: buyer1.id, role: 'buyer', full_name: buyer1.user_metadata.full_name, phone: buyer1.user_metadata.phone, avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400' },
    { id: buyer2.id, role: 'buyer', full_name: buyer2.user_metadata.full_name, phone: buyer2.user_metadata.phone, avatar_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400' },
    { id: seller1.id, role: 'seller', full_name: seller1.user_metadata.full_name, phone: seller1.user_metadata.phone, avatar_url: 'https://images.unsplash.com/photo-1504597103655-8ce632592f49?w=400' },
    { id: seller2.id, role: 'seller', full_name: seller2.user_metadata.full_name, phone: seller2.user_metadata.phone, avatar_url: 'https://images.unsplash.com/photo-1521579971123-1192931a1452?w=400' },
    { id: delivery.id, role: 'delivery', full_name: delivery.user_metadata.full_name, phone: delivery.user_metadata.phone, avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400' },
  ]);
  if (profilesErr) throw profilesErr;

  // Seller profiles
  const { error: sellerProfilesErr } = await supabase.from('seller_profiles').upsert([
    { id: seller1.id, business_name: 'Ira Collections', mobile: '+91 90000 22221', email: seller1.email, gst_number: 'GSTIN1234IRA', business_address: '12 MG Road, Bengaluru', bank_account_number: '1234567890', bank_ifsc: 'HDFC0000123', bank_account_name: 'Ira Collections Pvt Ltd', status: 'approved', accepted_terms_at: new Date().toISOString() },
    { id: seller2.id, business_name: 'Handloom Stories', mobile: '+91 90000 22222', email: seller2.email, gst_number: 'GSTIN5678HAND', business_address: '55 Residency Road, Jaipur', bank_account_number: '2234567890', bank_ifsc: 'ICIC0000456', bank_account_name: 'Handloom Stories LLP', status: 'approved', accepted_terms_at: new Date().toISOString() },
  ]);
  if (sellerProfilesErr) throw sellerProfilesErr;

  // Delivery account
  const { error: deliveryErr } = await supabase.from('delivery_accounts').upsert([
    { profile_id: delivery.id, code: 'DLV-001', phone: '+91 90000 33333', vehicle_details: 'Honda Activa · KA-05-1234', status: 'assigned' },
  ]);
  if (deliveryErr) throw deliveryErr;

  // Categories
  const { error: catErr } = await supabase.from('categories').upsert([
    { id: categoryIds[0], name: 'Ethnic Wear', icon: 'sparkles' },
    { id: categoryIds[1], name: 'Accessories', icon: 'star' },
    { id: categoryIds[2], name: 'Footwear', icon: 'shoe' },
  ]);
  if (catErr) throw catErr;

  // Products
  const now = new Date().toISOString();
  const { error: productErr } = await supabase.from('products').upsert([
    { id: productId1, seller_id: seller1.id, category_id: categoryIds[0], name: 'Aurora Handloom Kurta', description: 'Pastel cotton kurta with hand-block prints and hidden pockets.', price: 2499, status: 'active', sponsored_until: new Date(Date.now() + 7 * 86400000).toISOString(), commission_rate: 12.5, created_at: now, updated_at: now },
    { id: productId2, seller_id: seller2.id, category_id: categoryIds[0], name: 'Monsoon Pastel Saree', description: 'Chanderi silk saree with woven borders and lightweight drape.', price: 3799, status: 'active', commission_rate: 10, created_at: now, updated_at: now },
    { id: productId3, seller_id: seller1.id, category_id: categoryIds[1], name: 'Indie Canvas Tote', description: 'Everyday tote with Kalamkari artwork and laptop sleeve.', price: 1599, status: 'active', commission_rate: 8, created_at: now, updated_at: now },
  ]);
  if (productErr) throw productErr;

  // Product images
  const { error: imgErr } = await supabase.from('product_images').upsert([
    { product_id: productId1, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900', sort_order: 0 },
    { product_id: productId1, image_url: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=900', sort_order: 1 },
    { product_id: productId2, image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900', sort_order: 0 },
    { product_id: productId2, image_url: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=900', sort_order: 1 },
    { product_id: productId3, image_url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900', sort_order: 0 },
    { product_id: productId3, image_url: 'https://images.unsplash.com/photo-1539614474468-f1a646c91bde?w=900', sort_order: 1 },
  ]);
  if (imgErr) throw imgErr;

  // Variants
  const { error: variantErr } = await supabase.from('product_variants').upsert([
    { product_id: productId1, size: 'S', color: 'Blush', stock: 12 },
    { product_id: productId1, size: 'M', color: 'Seafoam', stock: 18 },
    { product_id: productId1, size: 'L', color: 'Seafoam', stock: 10, price_override: 2599 },
    { product_id: productId2, size: 'One Size', color: 'Mint', stock: 8 },
    { product_id: productId3, size: 'Standard', color: 'Indigo', stock: 20 },
  ]);
  if (variantErr) throw variantErr;

  // Fetch variants to get IDs for order items
  const { data: variants, error: vErr } = await supabase.from('product_variants').select('id, product_id, size').in('product_id', [productId1, productId2, productId3]);
  if (vErr) throw vErr;

  const vMap = {};
  for (const v of variants || []) {
    const key = `${v.product_id}|${v.size}`;
    vMap[key] = v.id;
  }

  // Addresses
  const { error: addrErr } = await supabase.from('addresses').upsert([
    { buyer_id: buyer1.id, label: 'Home', recipient_name: 'Ananya Rao', phone: '+91 90000 11111', line1: '201 Palm Residency', line2: 'MG Road', city: 'Bengaluru', state: 'KA', postal_code: '560001', is_default: true },
    { buyer_id: buyer2.id, label: 'Studio', recipient_name: 'Rahul Mehta', phone: '+91 90000 11112', line1: '44 Sunrise Manor', line2: 'Banjara Hills', city: 'Hyderabad', state: 'TS', postal_code: '500034', is_default: true },
  ]);
  if (addrErr) throw addrErr;

  // Orders
  const { data: orders, error: orderErr } = await supabase.from('orders').upsert([
    {
      buyer_id: buyer1.id,
      seller_id: seller1.id,
      delivery_partner_id: delivery.id,
      shipping_address: { name: 'Ananya Rao', phone: '+91 90000 11111', line1: '201 Palm Residency', line2: 'MG Road', city: 'Bengaluru', state: 'KA', postal_code: '560001' },
      subtotal_amount: 5098,
      commission_amount: 612,
      total_amount: 5098,
      payment_status: 'paid',
      order_status: 'out_for_delivery',
      delivery_status: 'out_for_delivery',
      razorpay_order_id: 'order_demo_1001',
      razorpay_payment_id: 'pay_demo_1001',
      placed_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: now,
    },
    {
      buyer_id: buyer2.id,
      seller_id: seller2.id,
      delivery_partner_id: null,
      shipping_address: { name: 'Rahul Mehta', phone: '+91 90000 11112', line1: '44 Sunrise Manor', line2: 'Banjara Hills', city: 'Hyderabad', state: 'TS', postal_code: '500034' },
      subtotal_amount: 3799,
      commission_amount: 380,
      total_amount: 3799,
      payment_status: 'paid',
      order_status: 'delivered',
      delivery_status: 'completed',
      razorpay_order_id: 'order_demo_1002',
      razorpay_payment_id: 'pay_demo_1002',
      placed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]).select('id');
  if (orderErr) throw orderErr;

  const order1 = orders?.[0];
  const order2 = orders?.[1];

  if (order1 && order2) {
    const { error: itemsErr } = await supabase.from('order_items').upsert([
      { order_id: order1.id, product_id: productId1, variant_id: vMap[`${productId1}|M`], quantity: 2, unit_price: 2499, total_price: 4998 },
      { order_id: order2.id, product_id: productId2, variant_id: vMap[`${productId2}|One Size`], quantity: 1, unit_price: 3799, total_price: 3799 },
    ]);
    if (itemsErr) throw itemsErr;

    const { error: reviewErr } = await supabase.from('reviews').upsert([
      { order_id: order2.id, product_id: productId2, buyer_id: buyer2.id, rating: 5, comment: 'Loved the fabric quality and pastel shade!', is_verified: true },
      { order_id: order1.id, product_id: productId1, buyer_id: buyer1.id, rating: 4, comment: 'Perfect summer kurta, slightly loose fit.', is_verified: true },
    ]);
    if (reviewErr) throw reviewErr;
  }

  console.log('\nDemo seed complete. You can now log in with:');
  for (const u of demoUsers) {
    console.log(`  ${u.role.padEnd(8)} ${u.email} / ${u.password}`);
  }
}

async function main() {
  await cleanup();
  await seed();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
