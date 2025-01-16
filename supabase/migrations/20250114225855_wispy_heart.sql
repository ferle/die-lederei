/*
  # Add sample products

  1. Changes
    - Add 60 sample products across different categories
    - Each product has a realistic name, description, price, and matching image
*/

INSERT INTO products (name, description, price, image_url, stock, category) VALUES
-- Gürtel
('Klassischer Ledergürtel Braun', 'Handgefertigter Gürtel aus vollnarbigem Rindsleder mit Messingschnalle', 7900, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc', 5, 'gürtel'),
('Vintage Ledergürtel Cognac', 'Eleganter Gürtel im Vintage-Look mit patinierter Schnalle', 8900, 'https://images.unsplash.com/photo-1553143820-6bb68bc34679', 3, 'gürtel'),
('Business Gürtel Schwarz', 'Formeller Gürtel aus feinstem Kalbsleder', 6900, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc', 8, 'gürtel'),
('Flechtgürtel Hellbraun', 'Handgeflochtener Gürtel aus weichem Rindsleder', 9900, 'https://images.unsplash.com/photo-1553143820-6bb68bc34679', 4, 'gürtel'),
('Western Gürtel', 'Breiter Gürtel im Western-Stil mit verzierter Schnalle', 11900, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc', 2, 'gürtel'),
('Damen Taillengürtel', 'Eleganter schmaler Gürtel mit goldener Schnalle', 7500, 'https://images.unsplash.com/photo-1553143820-6bb68bc34679', 6, 'gürtel'),
('Jeansgürtel Used Look', 'Casual Gürtel im Used-Look mit matter Schnalle', 6500, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc', 7, 'gürtel'),
('Premium Ledergürtel', 'Hochwertiger Gürtel aus Cordovan-Leder', 14900, 'https://images.unsplash.com/photo-1553143820-6bb68bc34679', 3, 'gürtel'),
('Minimalistischer Gürtel', 'Schlichter Gürtel aus vegetabil gegerbtem Leder', 8500, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc', 5, 'gürtel'),
('Handgenähter Gürtel', 'Traditionell handgenähter Gürtel mit Kantenschliff', 12900, 'https://images.unsplash.com/photo-1553143820-6bb68bc34679', 4, 'gürtel'),

-- Anhänger
('Leder Schlüsselanhänger', 'Handgefertigter Schlüsselanhänger aus Vollrindleder', 2900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 10, 'accessoires'),
('Vintage Taschenanhänger', 'Dekorativer Anhänger im Vintage-Stil', 3500, 'https://images.unsplash.com/photo-1603487742131-4160ec999306', 8, 'accessoires'),
('Personalisierter Anhänger', 'Anhänger mit individueller Prägung', 4500, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 6, 'accessoires'),
('Mini Geldbörse Anhänger', 'Praktischer Anhänger mit Kleingeldfach', 3900, 'https://images.unsplash.com/photo-1603487742131-4160ec999306', 7, 'accessoires'),
('Schlüsselband Deluxe', 'Langes Schlüsselband mit Karabiner', 3200, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 9, 'accessoires'),
('Glücksbringer Anhänger', 'Handgearbeiteter Glücksbringer aus Leder', 2500, 'https://images.unsplash.com/photo-1603487742131-4160ec999306', 12, 'accessoires'),
('Business Kartenhalter', 'Eleganter Anhänger für Visitenkarten', 4900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 5, 'accessoires'),
('Schlüsseletui Classic', 'Klassisches Etui für Autoschlüssel', 3800, 'https://images.unsplash.com/photo-1603487742131-4160ec999306', 6, 'accessoires'),
('Münzanhänger Vintage', 'Stilvoller Anhänger für Kleingeld', 2800, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 8, 'accessoires'),
('Leder Kompass Anhänger', 'Dekorativer Anhänger mit Kompass-Design', 4200, 'https://images.unsplash.com/photo-1603487742131-4160ec999306', 4, 'accessoires'),

-- Hundeleinen
('Premium Hundeleine', 'Robuste Leine aus bestem Rindsleder', 8900, 'https://images.unsplash.com/photo-1581888227599-779811939961', 4, 'accessoires'),
('City Hundeleine', 'Elegante kurze Leine für den Stadtspaziergang', 7900, 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c', 6, 'accessoires'),
('Tracking Hundeleine', 'Extra lange Leine für Fährtenarbeit', 9900, 'https://images.unsplash.com/photo-1581888227599-779811939961', 3, 'accessoires'),
('Hundeleine Deluxe', 'Handgenähte Leine mit Schulterpolster', 12900, 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c', 2, 'accessoires'),
('Sport Hundeleine', 'Leichte Leine für aktive Hunde', 6900, 'https://images.unsplash.com/photo-1581888227599-779811939961', 8, 'accessoires'),
('Vintage Hundeleine', 'Leine im klassischen Design', 8500, 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c', 5, 'accessoires'),
('Professionelle Hundeleine', 'Leine für Hundetrainer und Profis', 13900, 'https://images.unsplash.com/photo-1581888227599-779811939961', 3, 'accessoires'),
('Adjustable Hundeleine', 'Verstellbare Leine mit mehreren Längen', 9500, 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c', 6, 'accessoires'),
('Hundeleine Classic', 'Zeitlose Leine aus Vollrindleder', 7500, 'https://images.unsplash.com/photo-1581888227599-779811939961', 7, 'accessoires'),
('Premium Führleine', 'Hochwertige Leine mit Handschlaufe', 10900, 'https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c', 4, 'accessoires'),

-- Hosenträger
('Classic Hosenträger', 'Traditionelle Hosenträger aus Vollrindleder', 8900, 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef', 5, 'accessoires'),
('Business Hosenträger', 'Elegante Hosenträger für den Anzug', 9900, 'https://images.unsplash.com/photo-1507464098880-e367bc5d2c08', 4, 'accessoires'),
('Vintage Hosenträger', 'Hosenträger im Retro-Look', 7900, 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef', 6, 'accessoires'),
('Wedding Hosenträger', 'Festliche Hosenträger für besondere Anlässe', 11900, 'https://images.unsplash.com/photo-1507464098880-e367bc5d2c08', 3, 'accessoires'),
('Casual Hosenträger', 'Lässige Hosenträger für den Alltag', 6900, 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef', 8, 'accessoires'),
('Premium Hosenträger', 'Hochwertige Hosenträger mit Metallclips', 12900, 'https://images.unsplash.com/photo-1507464098880-e367bc5d2c08', 2, 'accessoires'),
('Handgefertigte Hosenträger', 'Individuell gefertigte Hosenträger', 13900, 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef', 3, 'accessoires'),
('Y-Form Hosenträger', 'Klassische Y-Form mit Lederbesatz', 8500, 'https://images.unsplash.com/photo-1507464098880-e367bc5d2c08', 6, 'accessoires'),
('Slim Hosenträger', 'Schmale Hosenträger im modernen Design', 7500, 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef', 7, 'accessoires'),
('Wide Hosenträger', 'Breite Hosenträger für optimalen Halt', 9500, 'https://images.unsplash.com/photo-1507464098880-e367bc5d2c08', 4, 'accessoires'),

-- Taschen
('Vintage Messenger Bag', 'Klassische Umhängetasche aus gewachstem Leder', 24900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 3, 'taschen'),
('Business Aktentasche', 'Elegante Aktentasche für Berufstätige', 29900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 2, 'taschen'),
('Shopper Deluxe', 'Geräumige Einkaufstasche aus Vollrindleder', 19900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 4, 'taschen'),
('Weekender Reisetasche', 'Stilvolle Reisetasche für Kurztrips', 34900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 2, 'taschen'),
('Mini Crossbody Bag', 'Kompakte Umhängetasche für Essentials', 14900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 6, 'taschen'),
('Laptop Tasche Premium', 'Professionelle Laptoptasche mit Polsterung', 27900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 3, 'taschen'),
('Handtasche Classic', 'Zeitlose Handtasche für jeden Anlass', 22900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 4, 'taschen'),
('Dokumententasche Slim', 'Schlanke Tasche für Dokumente', 17900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 5, 'taschen'),
('Bucket Bag Vintage', 'Lässige Beuteltasche im Vintage-Look', 18900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 3, 'taschen'),
('Schultertasche Deluxe', 'Elegante Schultertasche mit Extras', 25900, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7', 2, 'taschen'),

-- Schuhe
('Chelsea Boots Classic', 'Zeitlose Chelsea Boots aus Kalbsleder', 29900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 2, 'schuhe'),
('Oxford Business', 'Elegante Oxford-Schuhe für Business', 34900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 3, 'schuhe'),
('Loafer Casual', 'Bequeme Loafer für den Alltag', 24900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 4, 'schuhe'),
('Derby Premium', 'Hochwertige Derby-Schuhe aus Cordovan', 39900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 2, 'schuhe'),
('Monk Strap Elegant', 'Elegante Monk Strap Schuhe', 32900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 3, 'schuhe'),
('Boots Vintage', 'Handgefertigte Boots im Vintage-Stil', 36900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 2, 'schuhe'),
('Sneaker Premium', 'Luxuriöse Ledersneaker', 27900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 4, 'schuhe'),
('Slipper Classic', 'Klassische Lederslipper', 22900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 5, 'schuhe'),
('Budapester Premium', 'Traditionelle Budapester Schuhe', 42900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 2, 'schuhe'),
('Stiefel Handmade', 'Handgefertigte Lederstiefel', 44900, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', 1, 'schuhe');