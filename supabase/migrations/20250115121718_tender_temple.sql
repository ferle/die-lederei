/*
  # Fix Settings Table RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle all operations (SELECT, INSERT, UPDATE)
    - Ensure admins can perform all operations
    - Keep public read access

  2. Security
    - Maintain RLS
    - Allow public read access
    - Allow admin full access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON settings;
DROP POLICY IF EXISTS "Allow admin write access" ON settings;

-- Create new policies
CREATE POLICY "Allow public read access"
  ON settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin insert"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete"
  ON settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );