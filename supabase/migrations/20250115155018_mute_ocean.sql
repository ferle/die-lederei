-- Ensure all email templates have proper default values
UPDATE settings 
SET email_settings = jsonb_strip_nulls(
  COALESCE(email_settings, '{}'::jsonb) || '{
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
)
WHERE id IN (SELECT id FROM settings LIMIT 1);

-- Ensure we have exactly one settings row with proper defaults
DO $$
BEGIN
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