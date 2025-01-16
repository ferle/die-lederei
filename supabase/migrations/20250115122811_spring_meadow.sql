-- Add logo_url to settings table
ALTER TABLE settings ADD COLUMN logo_url text;

-- Update existing settings with default logo
UPDATE settings 
SET logo_url = 'https://srcmwjxskrirwyttrsjm.supabase.co/storage/v1/object/public/products/johanna-logo.png';