-- Add public read access to email_queue
CREATE POLICY "Allow public read access to email queue"
  ON email_queue
  FOR SELECT
  TO public
  USING (true);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS email_queue_created_at_idx ON email_queue(created_at DESC);