/*
  # Create products table for leather items

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (integer, in cents)
      - `image_url` (text)
      - `stock` (integer)
      - `created_at` (timestamp)
      - `category` (text)
      - `featured` (boolean)
  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  image_url text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  category text NOT NULL,
  featured boolean DEFAULT false
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin');