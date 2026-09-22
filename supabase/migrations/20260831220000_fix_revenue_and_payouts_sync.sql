-- Migration: Backfill payment_confirmed_at, sync payouts for all orders, and robust trigger

-- 1. Backfill payment_confirmed_at for all paid/online orders
UPDATE public.orders
SET 
  payment_confirmed_at = COALESCE(placed_at, now()),
  payment_status = 'paid'
WHERE (payment_method = 'online' OR payment_status = 'paid' OR order_status IN ('paid', 'packed', 'shipped', 'out_for_delivery', 'delivered'))
  AND payment_confirmed_at IS NULL;

-- 2. Populate payouts for all existing paid orders
INSERT INTO public.payouts (seller_id, order_id, amount, status, created_at)
SELECT 
  o.seller_id, 
  o.id, 
  GREATEST(0, o.subtotal_amount - COALESCE(o.commission_amount, 0)), 
  'pending',
  COALESCE(o.placed_at, now())
FROM public.orders o
WHERE o.seller_id IS NOT NULL
  AND o.order_status != 'cancelled'
  AND (o.payment_confirmed_at IS NOT NULL OR o.payment_method = 'online' OR o.payment_status = 'paid')
ON CONFLICT (order_id) DO NOTHING;

-- 3. Robust trigger function for automatic payout generation
CREATE OR REPLACE FUNCTION public.handle_order_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.payment_confirmed_at IS NOT NULL OR NEW.payment_status = 'paid' OR NEW.payment_method = 'online') 
     AND NEW.order_status != 'cancelled' 
     AND NEW.seller_id IS NOT NULL THEN
    INSERT INTO public.payouts (seller_id, order_id, amount, status, created_at)
    VALUES (
      NEW.seller_id, 
      NEW.id, 
      GREATEST(0, NEW.subtotal_amount - COALESCE(NEW.commission_amount, 0)), 
      'pending',
      now()
    )
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_payment_confirmed ON public.orders;
CREATE TRIGGER trg_order_payment_confirmed
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_payment_confirmed();
