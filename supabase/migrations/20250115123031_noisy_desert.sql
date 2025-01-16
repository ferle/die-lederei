-- Ensure settings table exists and has correct columns
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_text text NOT NULL DEFAULT '',
  hero_title text NOT NULL DEFAULT 'Handgefertigte Lederwaren mit Charakter',
  hero_subtitle text NOT NULL DEFAULT 'Entdecken Sie unsere Kollektion handgefertigter Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
  hero_cta text NOT NULL DEFAULT 'Zum Shop',
  logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON settings;
DROP POLICY IF EXISTS "Allow admin insert" ON settings;
DROP POLICY IF EXISTS "Allow admin update" ON settings;
DROP POLICY IF EXISTS "Allow admin delete" ON settings;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow public read access"
  ON settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert initial settings if not exists
INSERT INTO settings (id, about_text, hero_title, hero_subtitle, hero_cta)
SELECT 
  gen_random_uuid(),
  'Hallo! Mein Name ist Johanna, und ich habe es mir zur Aufgabe gemacht, altes Handwerk mit einem modernen Blick neu zu interpretieren...',
  'Handgefertigte Lederwaren mit Charakter',
  'Entdecken Sie unsere Kollektion handgefertigter Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
  'Zum Shop'
WHERE NOT EXISTS (SELECT 1 FROM settings);