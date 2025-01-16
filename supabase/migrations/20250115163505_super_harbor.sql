-- Drop existing notification function and recreate with better logging
CREATE OR REPLACE FUNCTION notify_email_service()
RETURNS trigger AS $$
BEGIN
  -- Log the notification
  RAISE NOTICE 'Notifying email service for email %: To: %, Subject: %', 
    NEW.id, NEW.to_email, NEW.subject;

  -- Notify the email service about the new email
  PERFORM pg_notify(
    'email_queue',  -- Changed channel name to be more specific
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

-- Recreate trigger with new channel name
DROP TRIGGER IF EXISTS notify_email_service_trigger ON email_queue;
CREATE TRIGGER notify_email_service_trigger
  AFTER INSERT OR UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_service();

-- Add status column for better tracking
ALTER TABLE email_queue 
ADD COLUMN IF NOT EXISTS status text 
DEFAULT 'pending'
CHECK (status IN ('pending', 'processing', 'sent', 'failed'));

-- Update indexes for better performance
DROP INDEX IF EXISTS email_queue_pending_idx;
DROP INDEX IF EXISTS email_queue_retry_idx;

CREATE INDEX email_queue_status_idx ON email_queue(status, next_attempt_at)
WHERE status IN ('pending', 'failed');

CREATE INDEX email_queue_processing_idx ON email_queue(status, created_at)
WHERE status = 'processing';