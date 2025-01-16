/*
  # Add categories table and update products

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `slug` (text, not null, unique)
      - `created_at` (timestamp)

  2. Changes
    - Add foreign key to products table referencing categories
    - Migrate existing category data

  3. Security
    - Enable RLS on categories table
    - Add policies for public read and admin write access
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow public read access"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin');

-- Insert initial categories
INSERT INTO categories (name, slug) VALUES
  ('Gürtel', 'gürtel'),
  ('Taschen', 'taschen'),
  ('Schuhe', 'schuhe'),
  ('Accessoires', 'accessoires');

-- Add category_id to products
ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id);

-- Update existing products with category_id
DO $$
DECLARE
  gürtel_id uuid;
  taschen_id uuid;
  schuhe_id uuid;
  accessoires_id uuid;
BEGIN
  SELECT id INTO gürtel_id FROM categories WHERE slug = 'gürtel';
  SELECT id INTO taschen_id FROM categories WHERE slug = 'taschen';
  SELECT id INTO schuhe_id FROM categories WHERE slug = 'schuhe';
  SELECT id INTO accessoires_id FROM categories WHERE slug = 'accessoires';

  -- Update products based on their current category text
  UPDATE products SET category_id = gürtel_id WHERE category = 'gürtel';
  UPDATE products SET category_id = taschen_id WHERE category = 'taschen';
  UPDATE products SET category_id = schuhe_id WHERE category = 'schuhe';
  UPDATE products SET category_id = accessoires_id WHERE category = 'accessoires';
END $$;