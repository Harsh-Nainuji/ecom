-- Migration: Inventory Management Fixes
-- Contains atomic stock updates, inventory reservations, and cancellation stock restoration.

-- 1. Create atomic increment_stock function for sellers
create or replace function public.increment_stock(p_variant_id uuid, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_stock int;
begin
  update public.product_variants
  set stock = greatest(stock + p_delta, 0)
  where id = p_variant_id
  returning stock into v_new_stock;

  return v_new_stock;
end;
$$;

grant execute on function public.increment_stock(uuid, int) to authenticated;

-- 2. Inventory Reservations Table
create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inv_res_variant_id on public.inventory_reservations(variant_id);
create index if not exists idx_inv_res_buyer_id on public.inventory_reservations(buyer_id);
create index if not exists idx_inv_res_expires_at on public.inventory_reservations(expires_at);

alter table public.inventory_reservations enable row level security;
-- Service role only accesses this via Edge functions, so no RLS policies needed.

-- 3. Update create_order_with_items to clear reservations upon successful checkout
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
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_current_stock int;
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

  for v_item in select * from jsonb_array_elements(p_order_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    if v_variant_id is not null then
      select stock into v_current_stock
      from public.product_variants
      where id = v_variant_id
      for update;

      if v_current_stock is not null then
        if v_current_stock < v_quantity then
          raise exception 'Insufficient stock for variant % (available: %, requested: %)',
            v_variant_id, v_current_stock, v_quantity;
        end if;

        update public.product_variants
        set stock = stock - v_quantity
        where id = v_variant_id;
      end if;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price
    )
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_variant_id,
      v_quantity,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric
    );
  end loop;

  delete from public.cart_items where buyer_id = p_buyer_id;
  delete from public.inventory_reservations where buyer_id = p_buyer_id;

  return v_order_id;
end;
$$;

-- 4. Trigger to restore stock when an order is cancelled
create or replace function public.handle_cancelled_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  if new.order_status = 'cancelled' and coalesce(old.order_status, '') <> 'cancelled' then
    for v_item in 
      select variant_id, quantity 
      from public.order_items 
      where order_id = new.id and variant_id is not null
    loop
      update public.product_variants
      set stock = stock + v_item.quantity
      where id = v_item.variant_id;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_restore_cancelled_stock on public.orders;
create trigger trg_restore_cancelled_stock
  after update on public.orders
  for each row
  when (new.order_status = 'cancelled' and old.order_status <> 'cancelled')
  execute function public.handle_cancelled_order_stock();
