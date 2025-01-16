/*
  # Add email queue and update settings

  1. Changes
    - Update existing email settings with default configuration
    - Create email queue table for reliable email sending
    - Add RLS policies for email queue
    
  2. Security
    - Email queue access restricted to admin users
    
  3. Notes
    - Assumes settings table with email_settings column exists
    - Email templates include placeholders for personalization
*/

-- Update existing settings with default email configuration
UPDATE settings 
SET email_settings = '{
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
}'::jsonb
WHERE email_settings IS NULL;

-- Create email_queue table for reliable email sending
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_queue') THEN
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

    -- Create policies for email_queue
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
  END IF;
END $$;