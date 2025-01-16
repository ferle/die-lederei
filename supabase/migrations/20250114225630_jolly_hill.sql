/*
  # Fix users table policies

  1. Changes
    - Remove recursive admin policy
    - Add separate policies for admin operations
    - Add policy for user creation
  
  2. Security
    - Maintain secure access control
    - Prevent infinite recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all data" ON users;

-- Create new policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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