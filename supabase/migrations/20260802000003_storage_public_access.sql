-- Ensure product-images storage bucket is marked public in Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Grant public read policy to storage.objects for product-images bucket
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
CREATE POLICY "Public Access to product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Grant upload policy to authenticated sellers for product-images bucket
DROP POLICY IF EXISTS "Authenticated users can upload product-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');
