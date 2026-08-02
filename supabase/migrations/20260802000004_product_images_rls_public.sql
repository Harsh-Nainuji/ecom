-- Enable RLS on product_images table
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Allow ALL users (anonymous guests, buyers, sellers) to SELECT from product_images table
DROP POLICY IF EXISTS "Public product_images select" ON public.product_images;
CREATE POLICY "Public product_images select"
  ON public.product_images FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update/delete product_images
DROP POLICY IF EXISTS "Authenticated product_images manage" ON public.product_images;
CREATE POLICY "Authenticated product_images manage"
  ON public.product_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
