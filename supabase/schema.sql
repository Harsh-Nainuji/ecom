-- --------------------------------------------------
-- FabZone Supabase Schema & RLS Policies
-- React Native (Expo) client + Next.js admin
-- --------------------------------------------------

-- Enable useful extensions ---------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Enumerations ---------------------------------------------------------------
create type public.user_role as enum ('buyer', 'seller', 'delivery', 'admin');
create type public.seller_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.product_status as enum ('draft', 'active', 'inactive');
create type public.order_status as enum (
  'pending',
  'paid',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled'
);
create type public.payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded');
create type public.delivery_state as enum ('unassigned', 'assigned', 'out_for_delivery', 'completed', 'failed');

-- Tables --------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'buyer',
  full_name text,
  phone text,
  avatar_url text,
  push_token text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles (role);

-- Helper functions -----------------------------------------------------------
create or replace function public.app_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.seller_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  business_name text not null,
  mobile text not null,
  email text not null,
  gst_number text,
  aadhar_number text,
  aadhar_card_url text,
  pan_number text,
  business_address text,
  bank_account_number text,
  bank_ifsc text,
  bank_account_name text,
  status public.seller_status not null default 'pending',
  accepted_terms_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  code text,
  phone text,
  vehicle_details text,
  status public.delivery_state not null default 'unassigned',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  status public.product_status not null default 'draft',
  sponsored_until timestamptz,
  commission_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_seller_idx on public.products (seller_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text,
  color text,
  stock int not null default 0 check (stock >= 0),
  price_override numeric(12,2)
);
create unique index if not exists product_variants_product_id_size_color_idx
  on public.product_variants (product_id, coalesce(size, ''), coalesce(color, ''));

create table if not exists public.wishlists (
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, product_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, variant_id)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_buyer_idx on public.addresses (buyer_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  delivery_partner_id uuid references public.profiles (id),
  shipping_address jsonb not null,
  subtotal_amount numeric(12,2) not null,
  commission_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  payment_status public.payment_status not null default 'pending',
  order_status public.order_status not null default 'pending',
  delivery_status public.delivery_state not null default 'unassigned',
  razorpay_order_id text,
  razorpay_payment_id text,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_seller_idx on public.orders (seller_id);
create index if not exists orders_delivery_idx on public.orders (delivery_partner_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  variant_id uuid references public.product_variants (id),
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.delivery_otps (
  order_id uuid primary key references public.orders (id) on delete cascade,
  otp_code char(6) not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  generated_at timestamptz not null default now(),
  attempt_count int not null default 0
);

-- helper functions ---------------------------------------------------------
create or replace function public.create_order_with_items(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_shipping_address jsonb,
  p_subtotal numeric,
  p_commission numeric,
  p_total numeric,
  p_order_items jsonb,
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  insert into public.orders (
    buyer_id,
    seller_id,
    shipping_address,
    subtotal_amount,
    commission_amount,
    total_amount,
    payment_status,
    order_status,
    razorpay_order_id,
    razorpay_payment_id
  )
  values (
    p_buyer_id,
    p_seller_id,
    p_shipping_address,
    p_subtotal,
    p_commission,
    p_total,
    'paid',
    'paid',
    p_razorpay_order_id,
    p_razorpay_payment_id
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    variant_id,
    quantity,
    unit_price,
    total_price
  )
  select
    v_order_id,
    (item->>'product_id')::uuid,
    (item->>'variant_id')::uuid,
    (item->>'quantity')::int,
    (item->>'unit_price')::numeric,
    (item->>'total_price')::numeric
  from jsonb_array_elements(p_order_items) as item;

  delete from public.cart_items where buyer_id = p_buyer_id;

  return v_order_id;
end;
$$;

create or replace function public.handle_out_for_delivery_otp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if new.order_status = 'out_for_delivery' and coalesce(old.order_status, 'pending') <> 'out_for_delivery' then
    v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');

    insert into public.delivery_otps (order_id, otp_code, expires_at, used, generated_at, attempt_count)
    values (new.id, v_code, now() + interval '24 hours', false, now(), 0)
    on conflict (order_id) do update
      set otp_code = excluded.otp_code,
          expires_at = excluded.expires_at,
          used = false,
          generated_at = now(),
          attempt_count = 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_delivery_otp on public.orders;
create trigger trg_generate_delivery_otp
  after update on public.orders
  for each row
  when (new.order_status = 'out_for_delivery' and coalesce(old.order_status, 'pending') <> 'out_for_delivery')
  execute function public.handle_out_for_delivery_otp();

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_verified boolean not null default true,
  is_reported boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews (product_id);

create table if not exists public.commission_settings (
  id int generated by default as identity primary key,
  commission_percent numeric(5,2) not null default 5.00,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsored_listings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  package_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index if not exists sponsored_product_idx on public.sponsored_listings (product_id);

-- Row Level Security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.delivery_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.wishlists enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.delivery_otps enable row level security;
alter table public.reviews enable row level security;
alter table public.commission_settings enable row level security;
alter table public.sponsored_listings enable row level security;

-- profiles -------------------------------------------------------------------
create policy "Users manage their own profile"
  on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- seller_profiles ------------------------------------------------------------
create policy "Seller can view their seller profile"
  on public.seller_profiles
  for select
  using (id = auth.uid());

create policy "Seller can write their seller profile"
  on public.seller_profiles
  for insert
  with check (id = auth.uid());

create policy "Seller can update their seller profile"
  on public.seller_profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- delivery_accounts ----------------------------------------------------------
create policy "Delivery users read their account"
  on public.delivery_accounts
  for select
  using (profile_id = auth.uid());

-- categories ----------------------------------------------------------------
create policy "All authenticated users can read categories"
  on public.categories
  for select
  using (true);

-- products ------------------------------------------------------------------
create policy "Anyone can read active products"
  on public.products
  for select
  using (status = 'active');

create policy "Sellers manage their products"
  on public.products
  for all
  using (seller_id = auth.uid())
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.status = 'approved'
    )
  );

-- product_images -------------------------------------------------------------
create policy "Sellers manage their product images"
  on public.product_images
  for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

-- product_variants -----------------------------------------------------------
create policy "Sellers manage their product variants"
  on public.product_variants
  for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

-- wishlists ------------------------------------------------------------------
create policy "Buyers manage their wishlist"
  on public.wishlists
  for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- cart_items -----------------------------------------------------------------
create policy "Buyers manage their cart"
  on public.cart_items
  for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- addresses ------------------------------------------------------------------
create policy "Buyers manage their addresses"
  on public.addresses
  for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- orders ---------------------------------------------------------------------
create policy "Buyers read their orders"
  on public.orders
  for select
  using (buyer_id = auth.uid());

create policy "Buyers place or cancel their orders"
  on public.orders
  for insert
  with check (buyer_id = auth.uid());

create policy "Buyers can update their orders"
  on public.orders
  for update
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

create policy "Sellers read their orders"
  on public.orders
  for select
  using (seller_id = auth.uid());

create policy "Sellers update order status"
  on public.orders
  for update
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "Delivery partners read assigned orders"
  on public.orders
  for select
  using (delivery_partner_id = auth.uid());

create policy "Delivery partners update delivery status"
  on public.orders
  for update
  using (delivery_partner_id = auth.uid())
  with check (delivery_partner_id = auth.uid());

-- order_items ----------------------------------------------------------------
create policy "Order owners read their order items"
  on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid() or o.delivery_partner_id = auth.uid())
    )
  );

create policy "Sellers insert order items for their orders"
  on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.seller_id = auth.uid()
    )
  );

-- delivery_otps --------------------------------------------------------------
create policy "Buyers read their OTP"
  on public.delivery_otps
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

create policy "Delivery partners update OTP state"
  on public.delivery_otps
  for update
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.delivery_partner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.delivery_partner_id = auth.uid()
    )
  );

-- reviews --------------------------------------------------------------------
create policy "Buyers manage their reviews"
  on public.reviews
  for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

create policy "All users can read reviews"
  on public.reviews
  for select
  using (true);

-- commission_settings --------------------------------------------------------
create policy "All users read commission settings"
  on public.commission_settings
  for select
  using (true);

-- sponsored_listings ---------------------------------------------------------
create policy "All users read sponsored listings"
  on public.sponsored_listings
  for select
  using (true);

-- home_banners ----------------------------------------------------------------
create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  link_url text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.home_banners enable row level security;

create policy if not exists "Anyone can view active banners"
  on public.home_banners
  for select
  using (active = true);

create policy if not exists "Admins manage banners"
  on public.home_banners
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- storage buckets --------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('home-banners', 'home-banners', true)
on conflict (id) do nothing;

create policy if not exists "Public read home banners"
  on storage.objects for select
  using (bucket_id = 'home-banners');

create policy if not exists "Admins upload home banners"
  on storage.objects for insert
  with check (bucket_id = 'home-banners' and public.is_admin());

create policy if not exists "Admins delete home banners"
  on storage.objects for delete
  using (bucket_id = 'home-banners' and public.is_admin());

-- admin helpers ----------------------------------------------------------------
create or replace function public.get_database_size_bytes()
returns bigint
language sql
security definer
set search_path = public
as $$
  select pg_database_size(current_database());
$$;

grant execute on function public.get_database_size_bytes to authenticated;

-- NOTE -----------------------------------------------------------------------
-- Admin & automation tasks should use the Supabase service_role key, which
-- bypasses RLS. The Next.js admin panel will run privileged mutations via
-- server-side API routes using that key.
