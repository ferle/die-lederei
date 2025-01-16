import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSMTP() {
  console.log('Starting SMTP test...\n');

  try {
    // Create transporter with SMTP settings
    console.log('Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
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

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection successful!\n');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: {
        name: 'Johanna Lederwaren',
        address: 'manuel@ferlitsch.net'
      },
      to: 'ferlitsch.manuel@gmail.com',
      subject: 'SMTP Test Email',
      text: 'This is a test email to verify SMTP settings are working correctly.'
    });

    console.log('✓ Test email sent successfully!');
    console.log('Message ID:', info.messageId);

    // Close connection
    await transporter.close();
    console.log('\nSMTP test completed successfully!');

  } catch (error) {
    console.error('\nSMTP test failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    process.exit(1);
  }
}

// Run the test
testSMTP().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});