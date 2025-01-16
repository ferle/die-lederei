/*
  # Add email trigger functions

  1. Changes
    - Create trigger functions for order and registration confirmation emails
    - Add triggers to orders and users tables
    
  2. Security
    - Functions run with SECURITY DEFINER to ensure proper access
    
  3. Notes
    - Assumes email_queue table already exists
    - Email templates support placeholders
*/

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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS send_order_confirmation_email ON orders;
DROP TRIGGER IF EXISTS send_registration_confirmation_email ON users;

-- Create triggers for email sending
CREATE TRIGGER send_order_confirmation_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION send_order_confirmation();

CREATE TRIGGER send_registration_confirmation_email
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION send_registration_confirmation();