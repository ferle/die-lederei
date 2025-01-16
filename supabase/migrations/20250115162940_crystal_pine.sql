-- Create function to notify email service
CREATE OR REPLACE FUNCTION notify_email_service()
RETURNS trigger AS $$
BEGIN
  -- Notify the email service about the new email
  PERFORM pg_notify(
    'send_email',
    json_build_object(
      'id', NEW.id,
      'type', COALESCE(NEW.metadata->>'type', 'unknown')
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify when new emails are added
DROP TRIGGER IF EXISTS notify_email_service_trigger ON email_queue;
CREATE TRIGGER notify_email_service_trigger
  AFTER INSERT ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_service();

-- Create function to manually process email queue
CREATE OR REPLACE FUNCTION trigger_email_processing()
RETURNS void AS $$
BEGIN
  PERFORM pg_notify('send_email', '{"type": "manual_trigger"}');
END;
$$ LANGUAGE plpgsql;