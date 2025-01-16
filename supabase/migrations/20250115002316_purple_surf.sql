-- Drop customers table and migrate data to users
DO $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Add new columns to users table
  ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS notes text;

  -- Migrate existing customer data to users table
  FOR customer_record IN SELECT * FROM customers LOOP
    UPDATE users 
    SET 
      name = customer_record.name,
      email = customer_record.email,
      phone = customer_record.phone,
      address = customer_record.address,
      notes = customer_record.notes
    WHERE id = customer_record.user_id;
  END LOOP;

  -- Drop customers table
  DROP TABLE IF EXISTS customers;
END $$;

-- Update orders table to reference users directly
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
  ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE SET NULL;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all data" ON users;
DROP POLICY IF EXISTS "Admins can update all data" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;

-- Create new policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all data"
  ON users
  FOR SELECT
  TO authenticated
  USING (role = 'admin');

CREATE POLICY "Admins can update all data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (role = 'admin');

CREATE POLICY "Allow insert during signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);