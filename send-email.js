import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srcmwjxskrirwyttrsjm.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY213anhza3Jpcnd5dHRyc2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU2ODYsImV4cCI6MjA1MjQ1MTY4Nn0.Q-tN2qjfIIFlnsU8xOeev3DtuPKeh8_Pnza1WzaYj0g'
);

// Create email transporter with retry logic
async function createTransporter(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {

    console.log(test);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.world4you.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'noreply@ferlitsch.net',
          pass: process.env.SMTP_PASS || 'Blub83408205!'
        },
        tls: {
          rejectUnauthorized: false
        },
        // Shorter timeouts with multiple retries
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      });

      // Verify connection
      await transporter.verify();
      console.log('SMTP connection established successfully');
      return transporter;
    } catch (error) {
      console.error(`SMTP connection attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Send a single email with retry logic
async function sendEmail(transporter, email, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Sending email to ${email.to_email} (attempt ${attempt}/${retries})...`);
      
      const info = await transporter.sendMail({
        from: {
          name: process.env.SMTP_FROM_NAME || 'Johanna Lederwaren',
          address: process.env.SMTP_FROM || 'noreply@ferlitsch.net'
        },
        to: email.to_email,
        subject: email.subject,
        text: email.body
      });

      console.log(`✓ Email sent successfully (${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Failed to send email (attempt ${attempt}/${retries}):`, error.message);
      if (attempt === retries) return { success: false, error: error.message };
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));


    }
  }
}

// Process email queue with improved error handling
async function processEmailQueue() {
  console.log('\nProcessing email queue...');
  let transporter;
  
  try {
    // Get pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .lte('next_attempt_at', new Date().toISOString())
      .order('created_at')
      .limit(5); // Reduced batch size for better reliability

    if (fetchError) throw fetchError;

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails to process');
      return;
    }

    console.log(`Found ${pendingEmails.length} emails to process`);

    // Create transporter with retries
    transporter = await createTransporter();

    // Process each email
    for (const email of pendingEmails) {
      console.log(`\nProcessing email ${email.id} to ${email.to_email}...`);

      try {
        // Update status to processing
        const { error: updateError } = await supabase
          .from('email_queue')
          .update({
            status: 'processing',
            attempts: email.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        if (updateError) throw updateError;

        // Send email with retries
        const result = await sendEmail(transporter, email);

        if (result.success) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              error: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error.message);

        // Calculate next retry with exponential backoff
        const nextAttempt = new Date(
          Date.now() + Math.min(Math.pow(2, email.attempts) * 5 * 60 * 1000, 24 * 60 * 60 * 1000)
        );

        // Mark as failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error: error.message,
            next_attempt_at: nextAttempt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);
      }

      // Add delay between emails
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
    }

  } catch (error) {
    console.error('Failed to process email queue:', error);
  } finally {
    // Always try to close the transporter
    if (transporter) {
      try {
        await transporter.close();
      } catch (error) {
        console.error('Error closing transporter:', error);
      }
    }
  }
}

// Main function with improved error handling
async function main() {
  console.log('Starting email service...');
  let running = false;
  
  // Process queue function with lock
  async function runQueue() {
    if (running) {
      console.log('Queue processing already in progress, skipping...');
      return;
    }
    
    running = true;
    try {
      await processEmailQueue();
    } catch (error) {
      console.error('Error in queue processing:', error);
    } finally {
      running = false;
    }
  }

  try {
    // Initial run
    await runQueue();

    // Set up interval
    setInterval(runQueue, 30000); // Run every 30 seconds

    // Handle process termination
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    console.error('Fatal error in email service:', error);
    process.exit(1);
  }
}

// Start the service
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});