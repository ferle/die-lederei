/*
  # Customers Schema Setup

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `created_at` (timestamp)
      - `notes` (text)

  2. Security
    - Enable RLS
    - Add policies for:
      - Admins can read/write all customers
      - Users can read their own customer data
*/

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'admin');

CREATE POLICY "Admins can modify all customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin');

CREATE POLICY "Users can read own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX customers_user_id_idx ON customers(user_id);
CREATE INDEX customers_email_idx ON customers(email);