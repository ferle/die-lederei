-- Make image_url nullable since we're using product_images table now
ALTER TABLE products ALTER COLUMN image_url DROP NOT NULL;

-- Update existing products to use first product_image as image_url
UPDATE products p
SET image_url = (
  SELECT url 
  FROM product_images pi 
  WHERE pi.product_id = p.id 
  AND pi.is_default = true 
  LIMIT 1
)
WHERE image_url IS NULL;