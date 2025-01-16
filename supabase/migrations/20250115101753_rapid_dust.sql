/*
  # Update Article Numbers

  1. Changes
    - Reset and regenerate article numbers for all products
    - Ensure article numbers are unique and sequential
    - Add constraints and index if not already present

  2. Security
    - Maintain existing RLS policies
*/

-- Ensure article numbers are unique and sequential
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

-- Ensure constraints exist (these will be skipped if they already exist)
DO $$
BEGIN
  -- Add NOT NULL constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'article_number' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE products ALTER COLUMN article_number SET NOT NULL;
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_article_number_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_article_number_unique UNIQUE (article_number);
  END IF;

  -- Add index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'products_article_number_idx'
  ) THEN
    CREATE INDEX products_article_number_idx ON products (article_number);
  END IF;
END $$;