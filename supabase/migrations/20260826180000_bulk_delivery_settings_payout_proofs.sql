-- Migration: Bulk Delivery, System Settings & Payout Proofs

-- 1. Orders table updates for Wholesale/Bulk Delivery
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_type') THEN
    ALTER TABLE public.orders ADD COLUMN shipping_type text NOT NULL DEFAULT 'retail';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transporter_name') THEN
    ALTER TABLE public.orders ADD COLUMN transporter_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'lr_number') THEN
    ALTER TABLE public.orders ADD COLUMN lr_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'lr_image_url') THEN
    ALTER TABLE public.orders ADD COLUMN lr_image_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pod_image_url') THEN
    ALTER TABLE public.orders ADD COLUMN pod_image_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_delivery_at') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery_at timestamptz;
  END IF;
END $$;

-- 2. Payouts table updates for Payment Proofs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'payment_proof_url') THEN
    ALTER TABLE public.payouts ADD COLUMN payment_proof_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'notes') THEN
    ALTER TABLE public.payouts ADD COLUMN notes text;
  END IF;
END $$;

-- 3. System Settings Table for Admin Bank & Razorpay Credentials
CREATE TABLE IF NOT EXISTS public.system_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  razorpay_live_key_id text,
  razorpay_live_key_secret text,
  admin_bank_account_name text,
  admin_bank_account_number text,
  admin_bank_ifsc text,
  admin_bank_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default row if not exists
INSERT INTO public.system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'system_settings' AND policyname = 'Admins manage system_settings'
  ) THEN
    CREATE POLICY "Admins manage system_settings"
      ON public.system_settings
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
  END IF;
END $$;

-- 4. Storage buckets for Payout Receipts and Delivery Proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payout-receipts', 'payout-receipts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  -- payout-receipts policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read payout receipts'
  ) THEN
    CREATE POLICY "Public read payout receipts"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'payout-receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins upload payout receipts'
  ) THEN
    CREATE POLICY "Admins upload payout receipts"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'payout-receipts');
  END IF;

  -- delivery-proofs policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read delivery proofs'
  ) THEN
    CREATE POLICY "Public read delivery proofs"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'delivery-proofs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users upload delivery proofs'
  ) THEN
    CREATE POLICY "Authenticated users upload delivery proofs"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'delivery-proofs');
  END IF;
END $$;
