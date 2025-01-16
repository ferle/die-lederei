/*
  # Add Article Numbers to Products

  1. Changes
    - Add article_number column to products table
    - Generate unique article numbers for existing products
    - Make article_number required and unique
    - Add index for faster lookups

  2. Security
    - Maintain existing RLS policies
*/

-- Add article_number column
ALTER TABLE products ADD COLUMN article_number text;

-- Generate article numbers for existing products
DO $$
DECLARE
  product_record RECORD;
  category_prefix text;
  counter int;
BEGIN
  -- Initialize counter for each category
  counter := 1;
  
  -- Process each product
  FOR product_record IN 
    SELECT id, category 
    FROM products 
    ORDER BY category, created_at
  LOOP
    -- Determine category prefix
    CASE product_record.category
      WHEN 'gürtel' THEN category_prefix := 'GB';
      WHEN 'taschen' THEN category_prefix := 'TB';
      WHEN 'schuhe' THEN category_prefix := 'SB';
      WHEN 'accessoires' THEN category_prefix := 'AB';
      ELSE category_prefix := 'XX';
    END CASE;
    
    -- Update product with new article number
    UPDATE products 
    SET article_number = category_prefix || '-' || LPAD(counter::text, 4, '0')
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