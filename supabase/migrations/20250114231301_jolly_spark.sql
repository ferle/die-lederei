/*
  # Add description to categories

  1. Changes
    - Add description column to categories table
    - Update existing categories with descriptions

  2. Security
    - Inherits existing RLS policies
*/

-- Add description column
ALTER TABLE categories ADD COLUMN description text;

-- Update existing categories with descriptions
UPDATE categories SET description = CASE 
  WHEN slug = 'gürtel' THEN 'Handgefertigte Ledergürtel in verschiedenen Stilen und Ausführungen. Von klassisch bis modern.'
  WHEN slug = 'taschen' THEN 'Hochwertige Ledertaschen für jeden Anlass. Handtaschen, Aktentaschen und mehr.'
  WHEN slug = 'schuhe' THEN 'Elegante Lederschuhe in traditioneller Handarbeit gefertigt. Qualität die man spürt.'
  WHEN slug = 'accessoires' THEN 'Stilvolle Lederaccessoires wie Geldbörsen, Schlüsselanhänger und mehr.'
  ELSE description
END;