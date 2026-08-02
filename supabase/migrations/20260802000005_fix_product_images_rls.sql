-- Enable RLS on product_images table
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Grant public SELECT policy for product_images table to anon and authenticated roles
DROP POLICY IF EXISTS "Allow public select on product_images" ON public.product_images;
CREATE POLICY "Allow public select on product_images"
  ON public.product_images
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

-- Grant full management permissions to authenticated sellers
DROP POLICY IF EXISTS "Allow sellers to manage product_images" ON public.product_images;
CREATE POLICY "Allow sellers to manage product_images"
  ON public.product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
