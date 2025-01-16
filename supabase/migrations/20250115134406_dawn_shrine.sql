-- Add about_short column to settings table
ALTER TABLE settings ADD COLUMN about_short text NOT NULL DEFAULT '';

-- Update existing settings with a default short description
UPDATE settings 
SET about_short = 'Mit Leidenschaft und Hingabe arbeite ich mit hochwertigem Leder, um einzigartige, handgefertigte Produkte zu schaffen. Jedes Stück erzählt eine eigene Geschichte von Sorgfalt, Präzision und der Liebe zum Detail.'
WHERE about_short = '';