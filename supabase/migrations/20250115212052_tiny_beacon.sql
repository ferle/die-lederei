-- Add status column if it doesn't exist
ALTER TABLE email_queue 
ADD COLUMN IF NOT EXISTS status text 
DEFAULT 'pending'
CHECK (status IN ('pending', 'processing', 'sent', 'failed'));

-- Add updated_at column if it doesn't exist
ALTER TABLE email_queue 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to manually trigger email processing
CREATE OR REPLACE FUNCTION manual_trigger_email_queue()
RETURNS text AS $$
DECLARE
  pending_count integer;
  processed_count integer;
BEGIN
  -- Get initial pending count
  SELECT COUNT(*) INTO pending_count
  FROM email_queue
  WHERE status = 'pending';

  -- Process the queue
  UPDATE email_queue 
  SET 
    status = 'processing',
    attempts = attempts + 1,
    next_attempt_at = now() + (POWER(2, attempts) * interval '5 minutes')
  WHERE status = 'pending'
  AND attempts < 3
  AND next_attempt_at <= now();
  
  GET DIAGNOSTICS processed_count = ROW_COUNT;

  -- Notify email service
  PERFORM pg_notify(
    'email_queue',
    json_build_object(
      'type', 'manual_trigger',
      'timestamp', extract(epoch from now())
    )::text
  );

  RETURN format('Triggered processing of %s pending emails. %s emails are being processed.', 
    pending_count::text, 
    processed_count::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manual_trigger_email_queue() TO authenticated;