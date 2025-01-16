-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'email_queue' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE email_queue 
    ADD COLUMN status text 
    DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS email_queue_status_idx 
ON email_queue(status, next_attempt_at)
WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS email_queue_processing_idx 
ON email_queue(status, created_at)
WHERE status = 'processing';

-- Create or replace notification function
CREATE OR REPLACE FUNCTION notify_email_service()
RETURNS trigger AS $$
BEGIN
  -- Log the notification
  RAISE NOTICE 'Notifying email service for email %: To: %, Subject: %', 
    NEW.id, NEW.to_email, NEW.subject;

  -- Notify the email service about the new email
  PERFORM pg_notify(
    'email_queue',
    json_build_object(
      'id', NEW.id,
      'type', COALESCE(NEW.metadata->>'type', 'unknown'),
      'to_email', NEW.to_email,
      'subject', NEW.subject,
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS notify_email_service_trigger ON email_queue;
CREATE TRIGGER notify_email_service_trigger
  AFTER INSERT OR UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_service();

-- Create function to manually process queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS void AS $$
DECLARE
  email_record RECORD;
  settings_record RECORD;
BEGIN
  -- Get settings
  SELECT * INTO settings_record FROM settings LIMIT 1;

  -- Check SMTP settings
  IF NULLIF(settings_record.email_settings->>'smtp_host', '') IS NULL THEN
    RAISE EXCEPTION 'SMTP settings not configured';
  END IF;

  -- Process pending emails
  FOR email_record IN 
    SELECT * FROM email_queue 
    WHERE status = 'pending'
    AND attempts < 3
    AND next_attempt_at <= now()
    ORDER BY created_at 
    LIMIT 10
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update status to processing
    UPDATE email_queue 
    SET 
      status = 'processing',
      attempts = attempts + 1
    WHERE id = email_record.id;

    -- Notify email service
    PERFORM pg_notify(
      'email_queue',
      json_build_object(
        'id', email_record.id,
        'type', 'process',
        'to_email', email_record.to_email,
        'subject', email_record.subject
      )::text
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing pending emails
UPDATE email_queue 
SET status = 'pending', next_attempt_at = now()
WHERE status IS NULL OR status = 'processing';