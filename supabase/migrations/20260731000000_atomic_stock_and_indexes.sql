-- Migration: Atomic stock lock & performance indexes
-- File: supabase/migrations/20260731000000_atomic_stock_and_indexes.sql

-- 1. Create Performance Indexes for Core E-Commerce Query Paths
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer_id ON public.cart_items (buyer_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items (variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_composite ON public.orders (payment_status, order_status);

-- 2. Update PL/pgSQL Order Placement Function with Atomic Stock Reduction & Lock
CREATE OR REPLACE FUNCTION public.create_order_with_items(
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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_current_stock int;
BEGIN
  -- Insert order record
  INSERT INTO public.orders (
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
  VALUES (
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
  RETURNING id INTO v_order_id;

  -- Loop through order items, check stock for update, and decrement atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    IF v_variant_id IS NOT NULL THEN
      -- Lock variant row and fetch current stock
      SELECT stock INTO v_current_stock
      FROM public.product_variants
      WHERE id = v_variant_id
      FOR UPDATE;

      IF v_current_stock IS NOT NULL THEN
        IF v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for variant % (available: %, requested: %)',
            v_variant_id, v_current_stock, v_quantity;
        END IF;

        -- Decrement stock atomically
        UPDATE public.product_variants
        SET stock = stock - v_quantity
        WHERE id = v_variant_id;
      END IF;
    END IF;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_variant_id,
      v_quantity,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric
    );
  END LOOP;

  -- Clear buyer cart items
  DELETE FROM public.cart_items WHERE buyer_id = p_buyer_id;

  RETURN v_order_id;
END;
$$;
