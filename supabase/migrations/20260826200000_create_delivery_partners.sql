-- Migration: Create public.delivery_partners table

CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read and admin/service_role full access
DROP POLICY IF EXISTS "Public read delivery_partners" ON public.delivery_partners;
CREATE POLICY "Public read delivery_partners" ON public.delivery_partners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access delivery_partners" ON public.delivery_partners;
CREATE POLICY "Service role full access delivery_partners" ON public.delivery_partners
  FOR ALL USING (true);
