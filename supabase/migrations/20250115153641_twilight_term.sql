-- Drop existing objects to ensure clean state
DROP TRIGGER IF EXISTS send_order_confirmation_email ON orders;
DROP TRIGGER IF EXISTS send_registration_confirmation_email ON users;
DROP FUNCTION IF EXISTS send_order_confirmation();
DROP FUNCTION IF EXISTS send_registration_confirmation();
DROP TABLE IF EXISTS email_queue;

-- Ensure settings table exists with all required columns
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_text text NOT NULL DEFAULT '',
  hero_title text NOT NULL DEFAULT 'Handgefertigte Lederwaren mit Charakter',
  hero_subtitle text NOT NULL DEFAULT 'Entdecken Sie unsere Kollektion handgefertigter Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
  hero_cta text NOT NULL DEFAULT 'Zum Shop',
  logo_url text,
  about_short text NOT NULL DEFAULT 'Mit Leidenschaft und Hingabe arbeite ich mit hochwertigem Leder, um einzigartige, handgefertigte Produkte zu schaffen. Jedes Stück erzählt eine eigene Geschichte von Sorgfalt, Präzision und der Liebe zum Detail.',
  email_settings jsonb DEFAULT '{
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_user": "",
    "smtp_password": "",
    "smtp_from_email": "",
    "smtp_from_name": "Johanna Lederwaren",
    "order_confirmation_subject": "Ihre Bestellung bei Johanna Lederwaren",
    "order_confirmation_template": "Sehr geehrte/r {customer_name},\n\nvielen Dank für Ihre Bestellung bei Johanna Lederwaren.\n\nIhre Bestellnummer: {order_id}\nBestelldatum: {order_date}\n\nBestellte Artikel:\n{order_items}\n\nGesamtbetrag: {total_amount}\n\nLieferadresse:\n{shipping_address}\n\nIch werde Ihre Bestellung schnellstmöglich bearbeiten.\n\nMit freundlichen Grüßen\nJohanna",
    "registration_subject": "Willkommen bei Johanna Lederwaren",
    "registration_template": "Sehr geehrte/r {customer_name},\n\nherzlich willkommen bei Johanna Lederwaren!\n\nIch freue mich sehr, Sie als neuen Kunden begrüßen zu dürfen. Ihr Konto wurde erfolgreich erstellt.\n\nIn Ihrem Kundenkonto können Sie:\n- Ihre persönlichen Daten verwalten\n- Ihre Bestellungen einsehen\n- Den Status Ihrer Bestellungen verfolgen\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nHerzliche Grüße\nJohanna"
  }'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
DROP POLICY IF EXISTS "Allow public read access" ON settings;
DROP POLICY IF EXISTS "Allow admin write access" ON settings;

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

-- Create email queue table
CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  error text,
  attempts integer DEFAULT 0,
  next_attempt_at timestamptz DEFAULT now(),
  metadata jsonb
);

-- Enable RLS on email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for email_queue
CREATE POLICY "Allow admin access to email queue"
  ON email_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to send order confirmation email
CREATE OR REPLACE FUNCTION send_order_confirmation()
RETURNS trigger AS $$
DECLARE
  settings_record RECORD;
  customer_name text;
  order_items text;
  total_amount text;
  shipping_address text;
BEGIN
  -- Get email settings
  SELECT * INTO settings_record FROM settings LIMIT 1;
  
  -- Get customer name
  SELECT COALESCE(first_name || ' ' || last_name, NEW.customer_name)
  INTO customer_name
  FROM users
  WHERE id = NEW.user_id;

  -- Format order items
  WITH items AS (
    SELECT 
      p.name,
      oi.quantity,
      (oi.price_at_time * oi.quantity / 100.0)::text || ' €' as total
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id
  )
  SELECT string_agg(
    quantity || 'x ' || name || ' (' || total || ')',
    E'\n'
  )
  INTO order_items
  FROM items;

  -- Format total amount
  SELECT (NEW.total_amount / 100.0)::text || ' €'
  INTO total_amount;

  -- Insert into email queue
  INSERT INTO email_queue (
    to_email,
    to_name,
    subject,
    body,
    metadata
  )
  VALUES (
    NEW.customer_email,
    customer_name,
    settings_record.email_settings->>'order_confirmation_subject',
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                settings_record.email_settings->>'order_confirmation_template',
                '{customer_name}', customer_name
              ),
              '{order_id}', NEW.id::text
            ),
            '{order_date}', to_char(NEW.created_at, 'DD.MM.YYYY HH24:MI')
          ),
          '{order_items}', order_items
        ),
        '{total_amount}', total_amount
      ),
      '{shipping_address}', NEW.shipping_address
    ),
    jsonb_build_object(
      'order_id', NEW.id,
      'type', 'order_confirmation'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send registration confirmation email
CREATE OR REPLACE FUNCTION send_registration_confirmation()
RETURNS trigger AS $$
DECLARE
  settings_record RECORD;
  customer_name text;
BEGIN
  -- Get email settings
  SELECT * INTO settings_record FROM settings LIMIT 1;
  
  -- Get customer name
  SELECT COALESCE(first_name || ' ' || last_name, NEW.email)
  INTO customer_name
  FROM users
  WHERE id = NEW.id;

  -- Insert into email queue
  INSERT INTO email_queue (
    to_email,
    to_name,
    subject,
    body,
    metadata
  )
  VALUES (
    NEW.email,
    customer_name,
    settings_record.email_settings->>'registration_subject',
    replace(
      settings_record.email_settings->>'registration_template',
      '{customer_name}', customer_name
    ),
    jsonb_build_object(
      'user_id', NEW.id,
      'type', 'registration_confirmation'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for email sending
CREATE TRIGGER send_order_confirmation_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION send_order_confirmation();

CREATE TRIGGER send_registration_confirmation_email
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION send_registration_confirmation();

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
    INSERT INTO settings (id) VALUES (gen_random_uuid());
  END IF;
END $$;