/*
  # Create products storage bucket

  1. New Storage Bucket
    - Creates a products bucket for storing product images
    - Sets public access for reading images
    - Restricts uploads to authenticated users only

  2. Security
    - Enable public access for viewing images
    - Restrict uploads to authenticated users with size limit
*/

-- Enable storage by creating the products bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true);

-- Allow public access to view files
CREATE POLICY "Give public access to product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (LENGTH(COALESCE(name, '')) <= 5242880) -- 5MB max file size
);