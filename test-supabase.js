import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import nodemailer from 'nodemailer';

// Hardcoded Supabase credentials
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
      user: 'noreply@ferlitsch.net',
      pass: 'Blub83408205!'
    },
    connectionTimeout: 20000,
    socketTimeout: 30000,
    greetingTimeout: 10000
  });
}

async function sendEmail(transporter, email) {
  try {
    const info = await transporter.sendMail({
      from: {
        name: 'Johanna Lederwaren',
        address: 'noreply@ferlitsch.net'
      },
      to: email.to_email,
      subject: email.subject,
      text: email.body
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processEmailQueue(client) {
  console.log('\nProcessing email queue...');

  // Get pending emails
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

  // Create email transporter
  const transporter = await createEmailTransporter();

  // Process each email
  for (const email of pendingEmails) {
    console.log(`\nProcessing email ${email.id} to ${email.to_email}...`);

    try {
      // Update status to processing
      await client.query(`
        UPDATE email_queue 
        SET status = 'processing', attempts = attempts + 1
        WHERE id = $1
      `, [email.id]);

      // Send email
      const result = await sendEmail(transporter, email);

      if (result.success) {
        // Mark as sent
        await client.query(`
          UPDATE email_queue 
          SET status = 'sent', sent_at = NOW(), error = NULL
          WHERE id = $1
        `, [email.id]);
        console.log(`✓ Email ${email.id} sent successfully (${result.messageId})`);
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
      await client.query(`
        UPDATE email_queue 
        SET status = 'failed', 
            error = $1,
            next_attempt_at = $2
        WHERE id = $3
      `, [error.message, nextAttempt, email.id]);
    }

    // Add delay between emails
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await transporter.close();
}

async function testConnections() {
  console.log('Starting connection tests...\n');
  
  // Test Supabase connection
  console.log('1. Testing Supabase connection:');
  
  try {
    console.log('Testing Supabase query...');
    
    // Try to fetch some statistics
    const [
      productsCount,
      ordersCount,
      usersCount,
      emailsCount
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('orders').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('email_queue').select('id', { count: 'exact' })
    ]);

    console.log('\nDatabase Statistics:');
    console.log('Products:', productsCount.count);
    console.log('Orders:', ordersCount.count);
    console.log('Users:', usersCount.count);
    console.log('Emails in queue:', emailsCount.count);

    // Fetch and display recent emails from queue
    const { data: recentEmails, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (emailError) throw emailError;

    console.log('\nRecent Emails in Queue:');
    if (recentEmails.length === 0) {
      console.log('No emails in queue');
    } else {
      recentEmails.forEach(email => {
        console.log(`\nEmail ID: ${email.id}`);
        console.log(`To: ${email.to_email}`);
        console.log(`Subject: ${email.subject}`);
        console.log(`Status: ${email.status}`);
        console.log(`Created: ${new Date(email.created_at).toLocaleString()}`);
        if (email.error) console.log(`Error: ${email.error}`);
      });
    }

    // Test PostgreSQL connection with retries
    console.log('\n2. Testing PostgreSQL connection:');
    let retries = 0;
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds

    while (retries < maxRetries) {
      let client;
      try {
        console.log(`Connection attempt ${retries + 1}...`);
        
        // Create client with explicit connection parameters
        client = new pg.Client({
          user: 'postgres',
          password: '83408205',
          host: 'db.srcmwjxskrirwyttrsjm.supabase.co',
          port: 5432,
          database: 'postgres',
          ssl: {
            mode: 'require',
            rejectUnauthorized: false
          },
          connectionTimeoutMillis: 20000,
          statement_timeout: 30000,
          query_timeout: 30000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
          application_name: 'test-supabase'
        });

        await client.connect();
        console.log('✓ PostgreSQL connection successful!');

        // Process email queue
        await processEmailQueue(client);

        // Close connection
        await client.end();
        console.log('\n✓ PostgreSQL connection closed successfully');

        // If we get here, all tests passed
        break;

      } catch (error) {
        console.error(`Connection attempt ${retries + 1} failed:`, {
          name: error.name,
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint
        });

        // Close client before retry
        if (client) {
          try {
            await client.end();
          } catch (endError) {
            console.error('Error closing client:', endError);
          }
        }

        retries++;
        
        if (retries >= maxRetries) {
          console.error('Max retries reached, exiting...');
          process.exit(1);
        }

        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

  } catch (error) {
    console.error('Test failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    process.exit(1);
  }

  console.log('\nAll tests completed successfully!');
  process.exit(0);
}

// Run the tests
testConnections().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});