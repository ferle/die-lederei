-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON product_images;
DROP POLICY IF EXISTS "Allow admin write access" ON product_images;

-- Create new policies for product_images table
CREATE POLICY "Allow public read access"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );