-- Drop existing cron job if it exists
SELECT cron.unschedule('process-email-queue');

-- Create new cron job with proper JSON handling
SELECT cron.schedule(
  'process-email-queue',  -- name of the cron job
  '* * * * *',           -- run every minute
  $$
  SELECT
    net.http_post(
      url := 'https://srcmwjxskrirwyttrsjm.supabase.co/rest/v1/rpc/manual_trigger_email_queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', current_setting('app.settings.service_role_key', true),
        'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key', true))
      )::jsonb,
      body := jsonb_build_object(
        'type', 'cron',
        'timestamp', extract(epoch from now())::text
      )::jsonb
    ) as request_id;
  $$
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS email_queue_status_next_attempt_idx 
ON email_queue (status, next_attempt_at) 
WHERE status IN ('pending', 'failed');