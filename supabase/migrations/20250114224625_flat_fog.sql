/*
  # Create users table and admin role

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `role` (text) - user role (admin, user)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on users table
    - Add policy for users to read their own data
    - Add policy for admins to read all data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all data"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));