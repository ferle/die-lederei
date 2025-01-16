-- Ensure we have exactly one settings row
DO $$
DECLARE
  settings_count integer;
  settings_id uuid;
BEGIN
  -- Count existing settings
  SELECT COUNT(*) INTO settings_count FROM settings;
  
  -- If we have no settings or multiple rows, fix it
  IF settings_count != 1 THEN
    -- Delete all settings
    DELETE FROM settings;
    
    -- Insert a single settings row
    INSERT INTO settings (
      id,
      about_text,
      hero_title,
      hero_subtitle,
      hero_cta,
      logo_url
    ) VALUES (
      gen_random_uuid(),
      'Hallo! Mein Name ist Johanna, und ich habe es mir zur Aufgabe gemacht, altes Handwerk mit einem modernen Blick neu zu interpretieren. Mit Leidenschaft und Hingabe arbeite ich mit hochwertigem Leder, um einzigartige, handgefertigte Produkte zu schaffen.

Ich absolvierte eine Ausbildung im traditionellen Handwerk und durfte meine Fähigkeiten mit Auszeichnungen wie dem 1. Platz beim Bundeslehrlingswettbewerb für Maßschuhmacher im Jahr 2015 unter Beweis stellen. Diese Anerkennung motivierte mich, meine Kreativität und Handwerkskunst weiterzuentwickeln und Produkte zu schaffen, die Funktionalität und Ästhetik verbinden.

In meiner Werkstatt kombiniere ich traditionelle Techniken mit kreativen Designs, um zeitlose und langlebige Stücke herzustellen. Jedes meiner Produkte erzählt eine eigene Geschichte – eine Geschichte von Sorgfalt, Präzision und der Liebe zum Detail.

Ob elegante Taschen, praktische Accessoires oder personalisierte Einzelstücke: Mein Ziel ist es, für jeden Kunden etwas Besonderes zu schaffen, das über Jahre hinweg Freude bereitet.

Danke, dass Sie mein Handwerk unterstützen – ich freue mich darauf, etwas Einzigartiges für Sie zu kreieren!',
      'Handgefertigte Lederwaren mit Charakter',
      'Entdecken Sie unsere Kollektion handgefertigter Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
      'Zum Shop',
      'https://srcmwjxskrirwyttrsjm.supabase.co/storage/v1/object/public/products/johanna-logo.png'
    );
  END IF;
END $$;