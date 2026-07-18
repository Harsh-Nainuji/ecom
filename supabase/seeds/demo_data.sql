begin;

-- Seed demo auth users --------------------------------------------------------
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, last_sign_in_at, aud, role, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'buyer.demo@fabzone.dev', crypt('DemoBuyer1!', gen_salt('bf')), now(), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111112', 'buyer.second@fabzone.dev', crypt('DemoBuyer2!', gen_salt('bf')), now(), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'seller.demo@fabzone.dev', crypt('DemoSeller1!', gen_salt('bf')), now(), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222223', 'seller.handloom@fabzone.dev', crypt('DemoSeller2!', gen_salt('bf')), now(), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'delivery.demo@fabzone.dev', crypt('DemoDelivery1!', gen_salt('bf')), now(), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb)
on conflict (id) do update
  set email = excluded.email,
      encrypted_password = excluded.encrypted_password,
      updated_at = excluded.updated_at,
      last_sign_in_at = excluded.last_sign_in_at;

-- Profiles --------------------------------------------------------------------
insert into public.profiles (id, role, full_name, phone, avatar_url, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', 'buyer', 'Ananya Rao', '+91 90000 11111', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', now(), now()),
  ('11111111-1111-1111-1111-111111111112', 'buyer', 'Rahul Mehta', '+91 90000 11112', 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'seller', 'Ira Collections', '+91 90000 22221', 'https://images.unsplash.com/photo-1504597103655-8ce632592f49?w=400', now(), now()),
  ('22222222-2222-2222-2222-222222222223', 'seller', 'Handloom Stories', '+91 90000 22222', 'https://images.unsplash.com/photo-1521579971123-1192931a1452?w=400', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'delivery', 'Swift Runner Logistics', '+91 90000 33333', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', now(), now())
on conflict (id) do update
  set role = excluded.role,
      full_name = excluded.full_name,
      phone = excluded.phone,
      avatar_url = excluded.avatar_url,
      updated_at = now();

-- Seller Profiles -------------------------------------------------------------
insert into public.seller_profiles (id, business_name, mobile, email, gst_number, business_address, bank_account_number, bank_ifsc, bank_account_name, status, accepted_terms_at, created_at, updated_at)
values
  ('22222222-2222-2222-2222-222222222222', 'Ira Collections', '+91 90000 22221', 'seller.demo@fabzone.dev', 'GSTIN1234IRA', '12 MG Road, Bengaluru', '1234567890', 'HDFC0000123', 'Ira Collections Pvt Ltd', 'approved', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222223', 'Handloom Stories', '+91 90000 22222', 'seller.handloom@fabzone.dev', 'GSTIN5678HAND', '55 Residency Road, Jaipur', '2234567890', 'ICIC0000456', 'Handloom Stories LLP', 'approved', now(), now(), now())
on conflict (id) do update
  set business_name = excluded.business_name,
      mobile = excluded.mobile,
      email = excluded.email,
      status = excluded.status,
      updated_at = now();

-- Delivery account ------------------------------------------------------------
insert into public.delivery_accounts (id, profile_id, code, phone, vehicle_details, status, created_at)
values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'DLV-001', '+91 90000 33333', 'Honda Activa · KA-05-1234', 'assigned', now())
on conflict (id) do update
  set phone = excluded.phone,
      vehicle_details = excluded.vehicle_details,
      status = excluded.status;

-- Categories ------------------------------------------------------------------
insert into public.categories (id, name, icon, created_at)
values
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Ethnic Wear', 'sparkles', now()),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Accessories', 'star', now()),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Footwear', 'shoe', now())
on conflict (id) do update
  set name = excluded.name,
      icon = excluded.icon;

-- Products --------------------------------------------------------------------
insert into public.products (id, seller_id, category_id, name, description, price, status, sponsored_until, commission_rate, created_at, updated_at)
values
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Aurora Handloom Kurta', 'Pastel cotton kurta with hand-block prints and hidden pockets.', 2499.00, 'active', now() + interval '7 days', 12.5, now() - interval '10 days', now()),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222223', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Monsoon Pastel Saree', 'Chanderi silk saree with woven borders and lightweight drape.', 3799.00, 'active', null, 10.0, now() - interval '8 days', now()),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '22222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Indie Canvas Tote', 'Everyday tote with Kalamkari artwork and laptop sleeve.', 1599.00, 'active', null, 8.0, now() - interval '5 days', now())
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      status = excluded.status,
      category_id = excluded.category_id,
      updated_at = now();

-- Product images --------------------------------------------------------------
insert into public.product_images (id, product_id, image_url, sort_order)
values
  ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900', 0),
  ('ccccccc2-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=900', 1),
  ('ccccccc3-cccc-cccc-cccc-ccccccccccc3', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900', 0),
  ('ccccccc4-cccc-cccc-cccc-ccccccccccc4', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=900', 1),
  ('ccccccc5-cccc-cccc-cccc-ccccccccccc5', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900', 0),
  ('ccccccc6-cccc-cccc-cccc-ccccccccccc6', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'https://images.unsplash.com/photo-1539614474468-f1a646c91bde?w=900', 1)
on conflict (id) do update
  set image_url = excluded.image_url,
      sort_order = excluded.sort_order;

-- Product variants ------------------------------------------------------------
insert into public.product_variants (id, product_id, size, color, stock, price_override)
values
  ('ddddddd1-dddd-dddd-dddd-ddddddddddd1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'S', 'Blush', 12, null),
  ('ddddddd2-dddd-dddd-dddd-ddddddddddd2', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'M', 'Seafoam', 18, null),
  ('ddddddd3-dddd-dddd-dddd-ddddddddddd3', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'L', 'Seafoam', 10, 2599.00),
  ('ddddddd4-dddd-dddd-dddd-ddddddddddd4', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'One Size', 'Mint', 8, null),
  ('ddddddd5-dddd-dddd-dddd-ddddddddddd5', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Standard', 'Indigo', 20, null)
on conflict (id) do update
  set stock = excluded.stock,
      price_override = excluded.price_override;

-- Addresses ------------------------------------------------------------------
insert into public.addresses (id, buyer_id, label, recipient_name, phone, line1, line2, city, state, postal_code, is_default, created_at)
values
  ('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', 'Home', 'Ananya Rao', '+91 90000 11111', '201 Palm Residency', 'MG Road', 'Bengaluru', 'KA', '560001', true, now()),
  ('eeeeeee2-eeee-eeee-eeee-eeeeeeeeeee2', '11111111-1111-1111-1111-111111111112', 'Studio', 'Rahul Mehta', '+91 90000 11112', '44 Sunrise Manor', 'Banjara Hills', 'Hyderabad', 'TS', '500034', true, now())
on conflict (id) do update
  set line1 = excluded.line1,
      line2 = excluded.line2,
      city = excluded.city,
      state = excluded.state,
      postal_code = excluded.postal_code,
      is_default = excluded.is_default;

-- Orders ---------------------------------------------------------------------
insert into public.orders (id, buyer_id, seller_id, delivery_partner_id, shipping_address, subtotal_amount, commission_amount, total_amount, payment_status, order_status, delivery_status, razorpay_order_id, razorpay_payment_id, placed_at, updated_at)
values
  ('fffffff1-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '{"name":"Ananya Rao","phone":"+91 90000 11111","line1":"201 Palm Residency","line2":"MG Road","city":"Bengaluru","state":"KA","postal_code":"560001"}'::jsonb, 5098.00, 612.00, 5098.00, 'paid', 'out_for_delivery', 'out_for_delivery', 'order_demo_1001', 'pay_demo_1001', now() - interval '1 day', now()),
  ('fffffff2-ffff-ffff-ffff-fffffffffff2', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222223', null, '{"name":"Rahul Mehta","phone":"+91 90000 11112","line1":"44 Sunrise Manor","line2":"Banjara Hills","city":"Hyderabad","state":"TS","postal_code":"500034"}'::jsonb, 3799.00, 380.00, 3799.00, 'paid', 'delivered', 'completed', 'order_demo_1002', 'pay_demo_1002', now() - interval '4 days', now() - interval '1 day')
on conflict (id) do update
  set buyer_id = excluded.buyer_id,
      seller_id = excluded.seller_id,
      order_status = excluded.order_status,
      delivery_status = excluded.delivery_status,
      subtotal_amount = excluded.subtotal_amount,
      total_amount = excluded.total_amount,
      updated_at = now();

-- Order items ----------------------------------------------------------------
insert into public.order_items (id, order_id, product_id, variant_id, quantity, unit_price, total_price, created_at)
values
  ('11111111-aaaa-bbbb-cccc-111111111111', 'fffffff1-ffff-ffff-ffff-fffffffffff1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'ddddddd2-dddd-dddd-dddd-ddddddddddd2', 2, 2499.00, 4998.00, now() - interval '1 day'),
  ('11111111-aaaa-bbbb-cccc-222222222222', 'fffffff2-ffff-ffff-ffff-fffffffffff2', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'ddddddd4-dddd-dddd-dddd-ddddddddddd4', 1, 3799.00, 3799.00, now() - interval '4 days')
on conflict (id) do update
  set quantity = excluded.quantity,
      unit_price = excluded.unit_price,
      total_price = excluded.total_price;

-- Reviews --------------------------------------------------------------------
insert into public.reviews (id, order_id, product_id, buyer_id, rating, comment, is_verified, is_reported, created_at)
values
  ('22222222-aaaa-bbbb-cccc-111111111111', 'fffffff2-ffff-ffff-ffff-fffffffffff2', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111112', 5, 'Loved the fabric quality and pastel shade!', true, false, now() - interval '2 days'),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'fffffff1-ffff-ffff-ffff-fffffffffff1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 4, 'Perfect summer kurta, slightly loose fit.', true, false, now() - interval '12 hours')
on conflict (id) do update
  set rating = excluded.rating,
      comment = excluded.comment,
      created_at = excluded.created_at;

commit;
