const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
    'https://srcmwjxskrirwyttrsjm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY213anhza3Jpcnd5dHRyc2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU2ODYsImV4cCI6MjA1MjQ1MTY4Nn0.Q-tN2qjfIIFlnsU8xOeev3DtuPKeh8_Pnza1WzaYj0g'
);

// Create email transporter with retry logic
async function createTransporter(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      await transporter.verify();
      console.log('SMTP connection established successfully');
      return transporter;
    } catch (error) {
      console.error(`SMTP connection attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

async function sendEmail(transporter, email, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Sending email to ${email.to_email} (attempt ${attempt}/${retries})...`);

      const info = await transporter.sendMail({
        from: {
          name: process.env.SMTP_FROM_NAME,
          address: process.env.SMTP_FROM,
        },
        to: email.to_email,
        subject: email.subject,
        text: email.body,
      });

      console.log(`✓ Email sent successfully (${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Failed to send email (attempt ${attempt}/${retries}):`, error.message);
      if (attempt === retries) return { success: false, error: error.message };
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

async function processEmailQueue() {
  console.log('\nProcessing email queue...');
  let transporter;

  try {
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .lte('next_attempt_at', new Date().toISOString())
      .order('created_at')
      .limit(5);

    if (fetchError) throw fetchError;

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails to process');
      return;
    }

    console.log(`Found ${pendingEmails.length} emails to process`);
    transporter = await createTransporter();

    for (const email of pendingEmails) {
      try {
        await supabase
          .from('email_queue')
          .update({ status: 'processing', attempts: email.attempts + 1 })
          .eq('id', email.id);

        const result = await sendEmail(transporter, email);

        if (result.success) {
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', email.id);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error.message);

        const nextAttempt = new Date(
          Date.now() + Math.min(Math.pow(2, email.attempts) * 5 * 60 * 1000, 24 * 60 * 60 * 1000)
        );

        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error: error.message,
            next_attempt_at: nextAttempt.toISOString(),
          })
          .eq('id', email.id);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Failed to process email queue:', error);
  } finally {
    if (transporter) {
      try {
        await transporter.close();
      } catch (error) {
        console.error('Error closing transporter:', error);
      }
    }
  }
}

exports.handler = async (event, context) => {
  try {
    await processEmailQueue();
    return { statusCode: 200, body: 'Email queue processed successfully.' };
  } catch (error) {
    console.error('Unhandled error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
