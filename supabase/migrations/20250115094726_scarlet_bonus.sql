/*
  # Add first and last name fields to users table

  1. Changes
    - Add first_name and last_name columns to users table
    - Split existing name data into first/last name
    - Update RLS policies to include new fields

  2. Security
    - Maintain existing RLS policies
    - Update policies to include new fields
*/

-- Add new columns
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- Split existing name data into first/last name
DO $$
DECLARE
  user_record RECORD;
  name_parts text[];
BEGIN
  FOR user_record IN SELECT id, name FROM users WHERE name IS NOT NULL LOOP
    name_parts := string_to_array(user_record.name, ' ');
    
    -- Update the user record
    UPDATE users 
    SET 
      first_name = name_parts[1],
      last_name = array_to_string(name_parts[2:array_length(name_parts, 1)], ' ')
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Drop the name column
ALTER TABLE users DROP COLUMN IF EXISTS name;

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all data" ON users;
DROP POLICY IF EXISTS "Admins can update all data" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;

-- Recreate policies with new fields
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