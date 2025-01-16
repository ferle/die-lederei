-- Insert initial settings if not exists
INSERT INTO settings (id, about_text, hero_title, hero_subtitle, hero_cta)
SELECT 
  gen_random_uuid(),
  'Hallo! Mein Name ist Johanna, und ich habe es mir zur Aufgabe gemacht, altes Handwerk mit einem modernen Blick neu zu interpretieren...',
  'Handgefertigte Lederwaren mit Charakter',
  'Entdecken Sie unsere Kollektion handgefertigter Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
  'Zum Shop'
WHERE NOT EXISTS (SELECT 1 FROM settings);