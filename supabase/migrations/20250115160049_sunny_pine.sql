-- Create function to send emails using SMTP settings
CREATE OR REPLACE FUNCTION process_email_queue() 
RETURNS void AS $$
DECLARE
  email_record RECORD;
  settings_record RECORD;
BEGIN
  -- Get settings with SMTP configuration
  SELECT * INTO settings_record FROM settings LIMIT 1;

  -- Check if SMTP settings are configured
  IF NULLIF(settings_record.email_settings->>'smtp_host', '') IS NULL OR
     NULLIF(settings_record.email_settings->>'smtp_user', '') IS NULL OR
     NULLIF(settings_record.email_settings->>'smtp_password', '') IS NULL OR
     NULLIF(settings_record.email_settings->>'smtp_from_email', '') IS NULL THEN
    RAISE EXCEPTION 'SMTP settings are not configured';
  END IF;

  -- Get unsent emails
  FOR email_record IN 
    SELECT * FROM email_queue 
    WHERE sent_at IS NULL 
    AND attempts < 3
    AND next_attempt_at <= now()
    ORDER BY created_at 
    LIMIT 10
  LOOP
    BEGIN
      -- Send email using pg_notify to trigger external email sender
      PERFORM pg_notify(
        'send_email',
        json_build_object(
          'id', email_record.id,
          'to_email', email_record.to_email,
          'to_name', email_record.to_name,
          'subject', email_record.subject,
          'body', email_record.body,
          'smtp_host', settings_record.email_settings->>'smtp_host',
          'smtp_port', (settings_record.email_settings->>'smtp_port')::integer,
          'smtp_user', settings_record.email_settings->>'smtp_user',
          'smtp_password', settings_record.email_settings->>'smtp_password',
          'smtp_from_email', settings_record.email_settings->>'smtp_from_email',
          'smtp_from_name', settings_record.email_settings->>'smtp_from_name'
        )::text
      );

      -- Update email record
      UPDATE email_queue 
      SET 
        attempts = attempts + 1,
        next_attempt_at = now() + (POWER(2, attempts) * interval '5 minutes')
      WHERE id = email_record.id;

    EXCEPTION WHEN OTHERS THEN
      -- Log error and update retry counter
      UPDATE email_queue 
      SET 
        error = SQLERRM,
        attempts = attempts + 1,
        next_attempt_at = now() + (POWER(2, attempts) * interval '5 minutes')
      WHERE id = email_record.id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manually retry failed emails
CREATE OR REPLACE FUNCTION retry_failed_emails() 
RETURNS void AS $$
BEGIN
  UPDATE email_queue 
  SET 
    attempts = 0,
    error = NULL,
    next_attempt_at = now()
  WHERE sent_at IS NULL 
  AND attempts >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;