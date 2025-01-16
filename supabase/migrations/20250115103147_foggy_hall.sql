-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow admin write access" ON products;
DROP POLICY IF EXISTS "Allow admin update access" ON products;
DROP POLICY IF EXISTS "Allow admin delete access" ON products;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin full access to product images" ON storage.objects;

-- Create new policies for products table
CREATE POLICY "Allow public read access"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create new policies for storage.objects
CREATE POLICY "Allow public read access to product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'products');

CREATE POLICY "Allow admin full access to product images"
  ON storage.objects
  FOR ALL
  TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.users ON auth.users.id = public.users.id
      WHERE auth.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );