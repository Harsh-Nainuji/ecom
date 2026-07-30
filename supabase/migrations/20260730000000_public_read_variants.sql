-- Migration to grant public read access to product_images and product_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'Anyone can read product images'
  ) THEN
    CREATE POLICY "Anyone can read product images" ON public.product_images FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_variants' AND policyname = 'Anyone can read product variants'
  ) THEN
    CREATE POLICY "Anyone can read product variants" ON public.product_variants FOR SELECT USING (true);
  END IF;
END $$;
