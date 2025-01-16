/*
  # Update product images with matching random images
  
  1. Changes
    - Update product images with category-specific random images
    - Add multiple images per product
    - Set default images
*/

-- Update Gürtel images
UPDATE product_images
SET url = CASE (FLOOR(RANDOM() * 4))::int
  WHEN 0 THEN 'https://images.unsplash.com/photo-1624222247344-550fb60583dc'
  WHEN 1 THEN 'https://images.unsplash.com/photo-1553143820-6bb68bc34679'
  WHEN 2 THEN 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4'
  ELSE 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0'
END
WHERE product_id IN (
  SELECT id FROM products WHERE category = 'gürtel'
);

-- Update Taschen images
UPDATE product_images
SET url = CASE (FLOOR(RANDOM() * 4))::int
  WHEN 0 THEN 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7'
  WHEN 1 THEN 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa'
  WHEN 2 THEN 'https://images.unsplash.com/photo-1591561954557-26941169b49e'
  ELSE 'https://images.unsplash.com/photo-1524498250077-390f9e378fc0'
END
WHERE product_id IN (
  SELECT id FROM products WHERE category = 'taschen'
);

-- Update Schuhe images
UPDATE product_images
SET url = CASE (FLOOR(RANDOM() * 4))::int
  WHEN 0 THEN 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76'
  WHEN 1 THEN 'https://images.unsplash.com/photo-1542838132-92c53300491e'
  WHEN 2 THEN 'https://images.unsplash.com/photo-1549298916-b41d501d3772'
  ELSE 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3'
END
WHERE product_id IN (
  SELECT id FROM products WHERE category = 'schuhe'
);

-- Update Accessoires images
UPDATE product_images
SET url = CASE (FLOOR(RANDOM() * 4))::int
  WHEN 0 THEN 'https://images.unsplash.com/photo-1603487742131-4160ec999306'
  WHEN 1 THEN 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7'
  WHEN 2 THEN 'https://images.unsplash.com/photo-1581888227599-779811939961'
  ELSE 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c'
END
WHERE product_id IN (
  SELECT id FROM products WHERE category = 'accessoires'
);

-- Add additional images for each product
DO $$
DECLARE
  product_record RECORD;
BEGIN
  FOR product_record IN SELECT id, category FROM products LOOP
    -- Add 2-4 additional images for each product
    FOR i IN 1..FLOOR(RANDOM() * 3 + 2) LOOP
      INSERT INTO product_images (product_id, url, is_default, "order")
      SELECT 
        product_record.id,
        CASE product_record.category
          WHEN 'gürtel' THEN (
            CASE (FLOOR(RANDOM() * 4))::int
              WHEN 0 THEN 'https://images.unsplash.com/photo-1624222247344-550fb60583dc'
              WHEN 1 THEN 'https://images.unsplash.com/photo-1553143820-6bb68bc34679'
              WHEN 2 THEN 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4'
              ELSE 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0'
            END
          )
          WHEN 'taschen' THEN (
            CASE (FLOOR(RANDOM() * 4))::int
              WHEN 0 THEN 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7'
              WHEN 1 THEN 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa'
              WHEN 2 THEN 'https://images.unsplash.com/photo-1591561954557-26941169b49e'
              ELSE 'https://images.unsplash.com/photo-1524498250077-390f9e378fc0'
            END
          )
          WHEN 'schuhe' THEN (
            CASE (FLOOR(RANDOM() * 4))::int
              WHEN 0 THEN 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76'
              WHEN 1 THEN 'https://images.unsplash.com/photo-1542838132-92c53300491e'
              WHEN 2 THEN 'https://images.unsplash.com/photo-1549298916-b41d501d3772'
              ELSE 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3'
            END
          )
          ELSE (
            CASE (FLOOR(RANDOM() * 4))::int
              WHEN 0 THEN 'https://images.unsplash.com/photo-1603487742131-4160ec999306'
              WHEN 1 THEN 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7'
              WHEN 2 THEN 'https://images.unsplash.com/photo-1581888227599-779811939961'
              ELSE 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c'
            END
          )
        END,
        false,
        i;
    END LOOP;
  END LOOP;
END $$;