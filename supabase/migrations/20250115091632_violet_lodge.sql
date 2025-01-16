-- Create settings table
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_text text NOT NULL DEFAULT '',
  hero_title text NOT NULL DEFAULT 'Handgefertigte Lederwaren mit Charakter',
  hero_subtitle text NOT NULL DEFAULT 'Entdecken Sie unsere Kollektion handgefertigter Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
  hero_cta text NOT NULL DEFAULT 'Zum Shop',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow public read access"
  ON settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access"
  ON settings
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin');

-- Insert initial settings
INSERT INTO settings (about_text)
VALUES (
  'Hallo! Mein Name ist Johanna, und ich habe es mir zur Aufgabe gemacht, altes Handwerk mit einem modernen Blick neu zu interpretieren. Mit Leidenschaft und Hingabe arbeite ich mit hochwertigem Leder, um einzigartige, handgefertigte Produkte zu schaffen.

Ich absolvierte eine Ausbildung im traditionellen Handwerk und durfte meine Fähigkeiten mit Auszeichnungen wie dem 1. Platz beim Bundeslehrlingswettbewerb für Maßschuhmacher im Jahr 2015 unter Beweis stellen. Diese Anerkennung motivierte mich, meine Kreativität und Handwerkskunst weiterzuentwickeln und Produkte zu schaffen, die Funktionalität und Ästhetik verbinden.

In meiner Werkstatt kombiniere ich traditionelle Techniken mit kreativen Designs, um zeitlose und langlebige Stücke herzustellen. Jedes meiner Produkte erzählt eine eigene Geschichte – eine Geschichte von Sorgfalt, Präzision und der Liebe zum Detail.

Ob elegante Taschen, praktische Accessoires oder personalisierte Einzelstücke: Mein Ziel ist es, für jeden Kunden etwas Besonderes zu schaffen, das über Jahre hinweg Freude bereitet.

Danke, dass Sie mein Handwerk unterstützen – ich freue mich darauf, etwas Einzigartiges für Sie zu kreieren!'
);