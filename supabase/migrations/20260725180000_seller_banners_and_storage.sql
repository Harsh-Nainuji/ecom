-- Ensure seller status enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seller_status') THEN
    CREATE TYPE public.seller_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
  END IF;
END $$;

-- Make sure every seller profile column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'business_name') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN business_name text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'mobile') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN mobile text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'email') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'gst_number') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN gst_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'aadhar_number') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN aadhar_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'aadhar_card_url') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN aadhar_card_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'pan_number') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN pan_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'business_address') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN business_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_account_number') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN bank_account_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_ifsc') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN bank_ifsc text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_account_name') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN bank_account_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'status') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN status public.seller_status NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'accepted_terms_at') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN accepted_terms_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'rejected_reason') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN rejected_reason text;
  END IF;
END $$;

-- Ensure profiles columns used by admin / notifications exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
    ALTER TABLE public.profiles ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'push_token') THEN
    ALTER TABLE public.profiles ADD COLUMN push_token text;
  END IF;
END $$;

-- Home banners table for admin-controlled marketing images
CREATE TABLE IF NOT EXISTS public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  link_url text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'home_banners' AND policyname = 'Anyone can view active banners'
  ) THEN
    CREATE POLICY "Anyone can view active banners"
      ON public.home_banners
      FOR SELECT
      USING (active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'home_banners' AND policyname = 'Admins manage banners'
  ) THEN
    CREATE POLICY "Admins manage banners"
      ON public.home_banners
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Storage bucket for home banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('home-banners', 'home-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banner bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read home banners'
  ) THEN
    CREATE POLICY "Public read home banners"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'home-banners');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins upload home banners'
  ) THEN
    CREATE POLICY "Admins upload home banners"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'home-banners' AND public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins delete home banners'
  ) THEN
    CREATE POLICY "Admins delete home banners"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'home-banners' AND public.is_admin());
  END IF;
END $$;

-- RPC for admin dashboard to show database usage
CREATE OR REPLACE FUNCTION public.get_database_size_bytes()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_database_size(current_database());
$$;

GRANT EXECUTE ON FUNCTION public.get_database_size_bytes TO authenticated;
