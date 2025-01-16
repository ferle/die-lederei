/*
  # Add product images support
  
  1. New Tables
    - `product_images`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `url` (text)
      - `is_default` (boolean)
      - `order` (integer)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `product_images` table
    - Add policies for public read access
    - Add policies for admin write access
*/

CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_default boolean DEFAULT false,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON product_images
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin');

-- Create index for better performance
CREATE INDEX product_images_product_id_idx ON product_images(product_id);

-- Migrate existing image_url data to product_images
INSERT INTO product_images (product_id, url, is_default, "order")
SELECT id, image_url, true, 0
FROM products;