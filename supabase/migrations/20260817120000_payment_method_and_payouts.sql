-- Migration: Payment Method and Payouts
-- File: supabase/migrations/20260817120000_payment_method_and_payouts.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
    CREATE TYPE public.payment_method_type AS ENUM ('cod', 'online');
  END IF;
END$$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method public.payment_method_type NOT NULL DEFAULT 'online';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cash_collected_by uuid NULL REFERENCES public.profiles (id);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  order_id uuid UNIQUE NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at timestamptz NULL,
  marked_by_admin uuid NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON public.payouts (seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts (status);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers read their payouts" ON public.payouts;
CREATE POLICY "Sellers read their payouts"
  ON public.payouts
  FOR SELECT
  USING (
    auth.uid() = seller_id
  );

DROP POLICY IF EXISTS "Admins manage payouts" ON public.payouts;
CREATE POLICY "Admins manage payouts"
  ON public.payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.handle_order_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_confirmed_at IS NOT NULL AND (OLD.payment_confirmed_at IS NULL OR OLD.payment_confirmed_at <> NEW.payment_confirmed_at) THEN
    INSERT INTO public.payouts (seller_id, order_id, amount, status)
    VALUES (NEW.seller_id, NEW.id, NEW.subtotal_amount - NEW.commission_amount, 'pending')
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_payment_confirmed ON public.orders;
CREATE TRIGGER trg_order_payment_confirmed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.payment_confirmed_at IS NOT NULL AND (OLD.payment_confirmed_at IS NULL OR OLD.payment_confirmed_at <> NEW.payment_confirmed_at))
  EXECUTE FUNCTION public.handle_order_payment_confirmed();
