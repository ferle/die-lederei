import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Supabase client
const supabase = createClient(
    'https://srcmwjxskrirwyttrsjm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY213anhza3Jpcnd5dHRyc2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU2ODYsImV4cCI6MjA1MjQ1MTY4Nn0.Q-tN2qjfIIFlnsU8xOeev3DtuPKeh8_Pnza1WzaYj0g'
);

async function createEmailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.world4you.com',
    port: 587,
    secure: false,
    auth: {
      user: 'manuel@ferlitsch.net',
      pass: 'Blub83408205'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function sendEmail(transporter, email) {
  try {
    console.log('Attempting to send email:', {
      to: email.to_email,
      subject: email.subject
    });

    const info = await transporter.sendMail({
      from: {
        name: 'Johanna Lederwaren',
        address: 'manuel@ferlitsch.net'
      },
      to: email.to_email,
      subject: email.subject,
      text: email.body
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

async function processEmailQueue(pool) {
  console.log('\nProcessing email queue...');

  const client = await pool.connect();
  try {
    const { rows: pendingEmails } = await client.query(`
      SELECT * FROM email_queue
      WHERE status = 'pending'
        AND attempts < 3
        AND next_attempt_at <= NOW()
      ORDER BY created_at
        LIMIT 5
    `);

    if (pendingEmails.length === 0) {
      console.log('No pending emails to process');
      return;
    }

    console.log(`Found ${pendingEmails.length} emails to process`);

    const transporter = await createEmailTransporter();

    for (const email of pendingEmails) {
      console.log(`\nProcessing email ${email.id} to ${email.to_email}...`);

      try {
        await client.query('BEGIN'); // Start a transaction

        await client.query(`
          UPDATE email_queue 
          SET status = 'processing', attempts = attempts + 1
          WHERE id = $1
        `, [email.id]);

        const result = await sendEmail(transporter, email);

        if (result.success) {
          await client.query(`
            UPDATE email_queue 
            SET status = 'sent', sent_at = NOW(), error = NULL
            WHERE id = $1
          `, [email.id]);
          console.log(`✓ Email ${email.id} sent successfully (${result.messageId})`);
        } else {
          throw new Error(result.error);
        }

        await client.query('COMMIT'); // Commit the transaction
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error.message);
        await client.query('ROLLBACK'); // Rollback the transaction in case of error

        const nextAttempt = new Date(
            Date.now() + Math.min(Math.pow(2, email.attempts) * 5 * 60 * 1000, 24 * 60 * 60 * 1000)
        );

        await client.query(`
          UPDATE email_queue
          SET status = 'failed',
              error = $1,
              next_attempt_at = $2
          WHERE id = $3
        `, [error.message, nextAttempt, email.id]);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await transporter.close();
  } catch (error) {
    console.error('Failed to process email queue:', error);
  } finally {
    client.release(); // Release the connection back to the pool
  }
}

async function testConnections() {
  console.log('Starting connection tests...\n');

  try {
    console.log('Testing Supabase query...');
    const { error } = await supabase.from('email_queue').select('*').limit(1);
    if (error) throw error;
    console.log('✓ Supabase connection successful');

    console.log('Testing PostgreSQL connection...');
    const pool = new pg.Pool({
      user: 'postgres',
      password: 'Blub83408205!',
      host: 'db.srcmwjxskrirwyttrsjm.supabase.co',
      port: 5432,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    await processEmailQueue(pool);

    await pool.end(); // Cleanly shut down the pool
  } catch (error) {
    console.error('Connection test failed:', error.message);
    process.exit(1);
  }

  console.log('\nAll tests completed successfully!');
  process.exit(0);
}

testConnections().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
