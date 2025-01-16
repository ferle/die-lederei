-- Update SMTP settings for World4You
UPDATE settings 
SET email_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        email_settings,
        '{smtp_host}',
        '"smtp.world4you.com"'
      ),
      '{smtp_user}',
      '"noreply@ferlitsch.net"'
    ),
    '{smtp_password}',
    '"Blub83408205!"'
  ),
  '{smtp_from_email}',
  '"noreply@ferlitsch.net"'
);

-- Reset any failed emails to try again
UPDATE email_queue
SET 
  status = 'pending',
  attempts = 0,
  next_attempt_at = now(),
  error = NULL
WHERE status IN ('failed', 'processing');