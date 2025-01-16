-- Add default SMTP settings if not set
UPDATE settings 
SET email_settings = jsonb_set(
  COALESCE(email_settings, '{}'::jsonb),
  '{smtp_host}',
  '"smtp.gmail.com"'
)
WHERE (email_settings->>'smtp_host') IS NULL OR (email_settings->>'smtp_host') = '';

UPDATE settings 
SET email_settings = jsonb_set(
  email_settings,
  '{smtp_port}',
  '587'
)
WHERE (email_settings->>'smtp_port') IS NULL;

UPDATE settings 
SET email_settings = jsonb_set(
  email_settings,
  '{smtp_user}',
  '"johanna@gmail.com"'
)
WHERE (email_settings->>'smtp_user') IS NULL OR (email_settings->>'smtp_user') = '';

UPDATE settings 
SET email_settings = jsonb_set(
  email_settings,
  '{smtp_from_email}',
  '"johanna@gmail.com"'
)
WHERE (email_settings->>'smtp_from_email') IS NULL OR (email_settings->>'smtp_from_email') = '';

-- Reset failed emails to pending
UPDATE email_queue
SET 
  status = 'pending',
  attempts = 0,
  next_attempt_at = now(),
  error = NULL
WHERE status IN ('failed', 'processing');