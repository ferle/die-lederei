-- Drop and recreate the order confirmation trigger function with better error handling
CREATE OR REPLACE FUNCTION send_order_confirmation()
RETURNS trigger AS $$
DECLARE
  settings_record RECORD;
  customer_name text;
  order_items text;
  total_amount text;
  email_template text;
  email_subject text;
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

  -- Get email template and subject with fallbacks
  SELECT 
    COALESCE(settings_record.email_settings->>'order_confirmation_template', 
      'Sehr geehrte/r {customer_name},\n\nvielen Dank für Ihre Bestellung bei Johanna Lederwaren.\n\nIhre Bestellnummer: {order_id}\nBestelldatum: {order_date}\n\nBestellte Artikel:\n{order_items}\n\nGesamtbetrag: {total_amount}\n\nLieferadresse:\n{shipping_address}\n\nIch werde Ihre Bestellung schnellstmöglich bearbeiten.\n\nMit freundlichen Grüßen\nJohanna'
    ),
    COALESCE(settings_record.email_settings->>'order_confirmation_subject',
      'Ihre Bestellung bei Johanna Lederwaren'
    )
  INTO email_template, email_subject;

  -- Insert into email queue with proper error handling
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
    email_subject,
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                email_template,
                '{customer_name}', COALESCE(customer_name, 'Kunde')
              ),
              '{order_id}', NEW.id::text
            ),
            '{order_date}', to_char(NEW.created_at, 'DD.MM.YYYY HH24:MI')
          ),
          '{order_items}', COALESCE(order_items, 'Keine Artikel')
        ),
        '{total_amount}', total_amount
      ),
      '{shipping_address}', COALESCE(NEW.shipping_address, '')
    ),
    jsonb_build_object(
      'order_id', NEW.id,
      'type', 'order_confirmation'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure default settings exist
DO $$
BEGIN
  -- Update any existing settings to ensure email templates exist
  UPDATE settings 
  SET email_settings = COALESCE(email_settings, '{}'::jsonb) || '{
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_user": "",
    "smtp_password": "",
    "smtp_from_email": "",
    "smtp_from_name": "Johanna Lederwaren",
    "order_confirmation_subject": "Ihre Bestellung bei Johanna Lederwaren",
    "order_confirmation_template": "Sehr geehrte/r {customer_name},\n\nvielen Dank für Ihre Bestellung bei Johanna Lederwaren.\n\nIhre Bestellnummer: {order_id}\nBestelldatum: {order_date}\n\nBestellte Artikel:\n{order_items}\n\nGesamtbetrag: {total_amount}\n\nLieferadresse:\n{shipping_address}\n\nIch werde Ihre Bestellung schnellstmöglich bearbeiten.\n\nMit freundlichen Grüßen\nJohanna",
    "shipping_confirmation_subject": "Ihre Bestellung wurde versendet",
    "shipping_confirmation_template": "Sehr geehrte/r {customer_name},\n\nIhre Bestellung mit der Nummer {order_id} wurde soeben versendet.\n\nBestellte Artikel:\n{order_items}\n\nLieferadresse:\n{shipping_address}\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüßen\nJohanna",
    "registration_subject": "Willkommen bei Johanna Lederwaren",
    "registration_template": "Sehr geehrte/r {customer_name},\n\nherzlich willkommen bei Johanna Lederwaren!\n\nIch freue mich sehr, Sie als neuen Kunden begrüßen zu dürfen. Ihr Konto wurde erfolgreich erstellt.\n\nIn Ihrem Kundenkonto können Sie:\n- Ihre persönlichen Daten verwalten\n- Ihre Bestellungen einsehen\n- Den Status Ihrer Bestellungen verfolgen\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nHerzliche Grüße\nJohanna"
  }'::jsonb;

  -- Insert default settings if none exist
  IF NOT EXISTS (SELECT 1 FROM settings) THEN
    INSERT INTO settings (
      about_text,
      hero_title,
      hero_subtitle,
      hero_cta,
      about_short,
      email_settings
    ) VALUES (
      'Hallo! Mein Name ist Johanna, und ich habe es mir zur Aufgabe gemacht, altes Handwerk mit einem modernen Blick neu zu interpretieren...',
      'Handgefertigte Lederwaren mit Charakter',
      'Entdecken Sie unsere Kollektion handgefertigter Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
      'Zum Shop',
      'Mit Leidenschaft und Hingabe arbeite ich mit hochwertigem Leder, um einzigartige, handgefertigte Produkte zu schaffen. Jedes Stück erzählt eine eigene Geschichte von Sorgfalt, Präzision und der Liebe zum Detail.',
      '{
        "smtp_host": "",
        "smtp_port": 587,
        "smtp_user": "",
        "smtp_password": "",
        "smtp_from_email": "",
        "smtp_from_name": "Johanna Lederwaren",
        "order_confirmation_subject": "Ihre Bestellung bei Johanna Lederwaren",
        "order_confirmation_template": "Sehr geehrte/r {customer_name},\n\nvielen Dank für Ihre Bestellung bei Johanna Lederwaren.\n\nIhre Bestellnummer: {order_id}\nBestelldatum: {order_date}\n\nBestellte Artikel:\n{order_items}\n\nGesamtbetrag: {total_amount}\n\nLieferadresse:\n{shipping_address}\n\nIch werde Ihre Bestellung schnellstmöglich bearbeiten.\n\nMit freundlichen Grüßen\nJohanna",
        "shipping_confirmation_subject": "Ihre Bestellung wurde versendet",
        "shipping_confirmation_template": "Sehr geehrte/r {customer_name},\n\nIhre Bestellung mit der Nummer {order_id} wurde soeben versendet.\n\nBestellte Artikel:\n{order_items}\n\nLieferadresse:\n{shipping_address}\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüßen\nJohanna",
        "registration_subject": "Willkommen bei Johanna Lederwaren",
        "registration_template": "Sehr geehrte/r {customer_name},\n\nherzlich willkommen bei Johanna Lederwaren!\n\nIch freue mich sehr, Sie als neuen Kunden begrüßen zu dürfen. Ihr Konto wurde erfolgreich erstellt.\n\nIn Ihrem Kundenkonto können Sie:\n- Ihre persönlichen Daten verwalten\n- Ihre Bestellungen einsehen\n- Den Status Ihrer Bestellungen verfolgen\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nHerzliche Grüße\nJohanna"
      }'::jsonb
    );
  END IF;
END $$;