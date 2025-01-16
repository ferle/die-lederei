-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin full access to product images" ON storage.objects;

-- Create new storage policies with separate INSERT policy
CREATE POLICY "Allow public read access to product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'products');

CREATE POLICY "Allow admin insert to product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admin modify product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );