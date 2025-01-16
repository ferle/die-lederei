/*
  # Add product date column and indexes

  1. New Columns
    - `added_date` (timestamptz) - When the product was added
  2. Changes
    - Add default value using NOW()
    - Backfill existing products
  3. Indexes
    - Add index on added_date for faster sorting
*/

-- Add added_date column
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS added_date timestamptz DEFAULT now();

-- Backfill existing products using created_at
UPDATE products 
SET added_date = created_at 
WHERE added_date IS NULL;

-- Make added_date required
ALTER TABLE products 
  ALTER COLUMN added_date SET NOT NULL;

-- Add index for sorting
CREATE INDEX IF NOT EXISTS products_added_date_idx ON products(added_date);