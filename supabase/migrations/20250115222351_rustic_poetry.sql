-- Enable required extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create cron job to process email queue
SELECT cron.schedule(
  'process-email-queue',  -- name of the cron job
  '* * * * *',           -- run every minute
  $$
  SELECT
    net.http_post(
      url := 'https://srcmwjxskrirwyttrsjm.supabase.co/functions/v1/send-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb
    ) as request_id;
  $$
);