/*
  # Create About Images Table

  1. New Tables
    - `about_images`
      - `id` (uuid, primary key)
      - `url` (text, required)
      - `order` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create about_images table
CREATE TABLE about_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE about_images ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow public read access"
  ON about_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON about_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add index for ordering
CREATE INDEX about_images_order_idx ON about_images("order");