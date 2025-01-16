-- Drop existing storage policies
DROP POLICY IF EXISTS "Give public access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Allow public read access to product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'products');

CREATE POLICY "Allow admin full access to product images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.users ON auth.users.id = public.users.id
      WHERE auth.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );