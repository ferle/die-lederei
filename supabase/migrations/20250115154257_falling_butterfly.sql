-- Verify email settings structure and templates
DO $$
DECLARE
  settings_record RECORD;
BEGIN
  -- Get current settings
  SELECT * INTO settings_record FROM settings LIMIT 1;

  -- Check if shipping confirmation templates exist
  IF NOT (settings_record.email_settings ? 'shipping_confirmation_subject') OR
     NOT (settings_record.email_settings ? 'shipping_confirmation_template') THEN
    
    -- Update settings with shipping confirmation templates
    UPDATE settings 
    SET email_settings = email_settings || '{
      "shipping_confirmation_subject": "Ihre Bestellung wurde versendet",
      "shipping_confirmation_template": "Sehr geehrte/r {customer_name},\n\nIhre Bestellung mit der Nummer {order_id} wurde soeben versendet.\n\nBestellte Artikel:\n{order_items}\n\nLieferadresse:\n{shipping_address}\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüßen\nJohanna"
    }'::jsonb;
  END IF;
END $$;