-- Add featured column to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Add index for featured products
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(featured);

-- Set some products as featured
UPDATE products 
SET featured = true 
WHERE id IN (
  SELECT id 
  FROM products 
  ORDER BY random() 
  LIMIT 4
);