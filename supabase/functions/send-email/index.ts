import { serve } from 'https://deno.fresh.dev/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

// Create Supabase client
const supabaseClient = createClient(
  'https://srcmwjxskrirwyttrsjm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY213anhza3Jpcnd5dHRyc2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU2ODYsImV4cCI6MjA1MjQ1MTY4Nn0.Q-tN2qjfIIFlnsU8xOeev3DtuPKeh8_Pnza1WzaYj0g'
);

serve(async (req) => {
  try {
    // Get settings with SMTP configuration
    const { data: settings, error: settingsError } = await supabaseClient
      .from('settings')
      .select('email_settings')
      .single();

    if (settingsError) throw settingsError;
    if (!settings?.email_settings) throw new Error('Email settings not found');

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.world4you.com',
        port: 587,
        tls: false,
        auth: {
          username: 'noreply@ferlitsch.net',
          password: 'Blub83408205!'
        }
      }
    });

    // Get pending emails
    const { data: emails, error: emailsError } = await supabaseClient
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .lte('next_attempt_at', new Date().toISOString())
      .order('created_at')
      .limit(10);

    if (emailsError) throw emailsError;
    if (!emails?.length) {
      return new Response(JSON.stringify({ message: 'No pending emails' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process each email
    const results = await Promise.all(emails.map(async (email) => {
      try {
        // Update status to processing
        await supabaseClient
          .from('email_queue')
          .update({
            status: 'processing',
            attempts: email.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        // Send email
        await client.send({
          from: {
            name: 'Johanna Lederwaren',
            email: 'noreply@ferlitsch.net'
          },
          to: email.to_email,
          subject: email.subject,
          content: email.body
        });

        // Mark as sent
        await supabaseClient
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        return { id: email.id, status: 'sent' };

      } catch (error) {
        console.error(`Error sending email ${email.id}:`, error);

        // Calculate next retry with exponential backoff
        const nextAttempt = new Date(
          Date.now() + Math.min(Math.pow(2, email.attempts) * 5 * 60 * 1000, 24 * 60 * 60 * 1000)
        );

        // Mark as failed
        await supabaseClient
          .from('email_queue')
          .update({
            status: 'failed',
            error: error.message,
            next_attempt_at: nextAttempt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        return { id: email.id, status: 'failed', error: error.message };
      }
    }));

    await client.close();

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing emails:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});