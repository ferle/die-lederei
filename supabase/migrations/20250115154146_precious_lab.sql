/*
  # Add shipping confirmation email

  1. Changes
    - Add shipping confirmation email template to settings
    - Create trigger function for shipping confirmation
    - Add trigger for order status changes
    
  2. Notes
    - Sends email when order status changes to 'completed'
    - Uses existing email queue system
*/

-- Add shipping confirmation template to email settings
UPDATE settings 
SET email_settings = jsonb_set(
  email_settings,
  '{shipping_confirmation_subject}',
  '"Ihre Bestellung wurde versendet"'
)::jsonb;

UPDATE settings 
SET email_settings = jsonb_set(
  email_settings,
  '{shipping_confirmation_template}',
  '"Sehr geehrte/r {customer_name},\n\nIhre Bestellung mit der Nummer {order_id} wurde soeben versendet.\n\nBestellte Artikel:\n{order_items}\n\nLieferadresse:\n{shipping_address}\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüßen\nJohanna"'
)::jsonb;

-- Create function to send shipping confirmation email
CREATE OR REPLACE FUNCTION send_shipping_confirmation()
RETURNS trigger AS $$
DECLARE
  settings_record RECORD;
  customer_name text;
  order_items text;
  shipping_address text;
BEGIN
  -- Only send email when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
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
        oi.quantity
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    )
    SELECT string_agg(
      quantity || 'x ' || name,
      E'\n'
    )
    INTO order_items
    FROM items;

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
      settings_record.email_settings->>'shipping_confirmation_subject',
      replace(
        replace(
          replace(
            replace(
              settings_record.email_settings->>'shipping_confirmation_template',
              '{customer_name}', customer_name
            ),
            '{order_id}', NEW.id::text
          ),
          '{order_items}', order_items
        ),
        '{shipping_address}', NEW.shipping_address
      ),
      jsonb_build_object(
        'order_id', NEW.id,
        'type', 'shipping_confirmation'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for shipping confirmation emails
DROP TRIGGER IF EXISTS send_shipping_confirmation_email ON orders;
CREATE TRIGGER send_shipping_confirmation_email
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION send_shipping_confirmation();