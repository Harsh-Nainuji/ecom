-- Migration: Create/Update public.categories table and seed initial categories

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Add optional missing columns if they don't exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon_url text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

-- Allow full access to service_role and authenticated users
DROP POLICY IF EXISTS "Full access categories" ON public.categories;
CREATE POLICY "Full access categories" ON public.categories
  FOR ALL USING (true);

-- Insert initial default categories if empty
INSERT INTO public.categories (name, slug, display_order)
VALUES
  ('Sarees & Ethnic Wear', 'sarees-ethnic-wear', 1),
  ('Lehengas & Suits', 'lehengas-suits', 2),
  ('Fabrics & Textiles', 'fabrics-textiles', 3),
  ('Western & Casual Wear', 'western-casual-wear', 4),
  ('Footwear & Sandals', 'footwear-sandals', 5),
  ('Jewelry & Accessories', 'jewelry-accessories', 6),
  ('Home & Living Textiles', 'home-living-textiles', 7)
ON CONFLICT (name) DO NOTHING;
