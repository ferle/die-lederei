/*
  # Add Article Numbers to Products

  1. Changes
    - Add article_number column to products table
    - Generate sequential article numbers for existing products
    - Make article_number required and unique
    - Add index for faster lookups

  2. Security
    - Maintain existing RLS policies
*/

-- Add article_number column
ALTER TABLE products ADD COLUMN article_number text;

-- Generate sequential article numbers for existing products
DO $$
DECLARE
  product_record RECORD;
  counter int;
BEGIN
  -- Initialize counter
  counter := 1000;
  
  -- Process each product
  FOR product_record IN 
    SELECT id 
    FROM products 
    ORDER BY created_at
  LOOP
    -- Update product with new article number
    UPDATE products 
    SET article_number = counter::text
    WHERE id = product_record.id;
    
    counter := counter + 1;
  END LOOP;
END $$;

-- Make article_number required and unique
ALTER TABLE products 
  ALTER COLUMN article_number SET NOT NULL,
  ADD CONSTRAINT products_article_number_unique UNIQUE (article_number);

-- Add index for faster lookups
CREATE INDEX products_article_number_idx ON products (article_number);