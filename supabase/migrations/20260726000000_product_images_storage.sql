-- Add product-images bucket and RLS policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read product images'
  ) THEN
    CREATE POLICY "Public read product images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Sellers upload product images'
  ) THEN
    CREATE POLICY "Sellers upload product images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'product-images' AND public.app_user_role() IN ('seller', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Sellers delete product images'
  ) THEN
    CREATE POLICY "Sellers delete product images"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'product-images' AND (public.is_admin() OR public.app_user_role() = 'seller'));
  END IF;
END $$;
