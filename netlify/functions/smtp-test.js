import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSMTP() {
  try {
    console.log('Starting SMTP test...');

    // Create transporter with SMTP settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.world4you.com',
      port: 587,
      secure: false,
      auth: {
        user: 'manuel@ferlitsch.net',
        pass: 'Blub83408205',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('SMTP connection successful!');

    // Send test email
    const info = await transporter.sendMail({
      from: {
        name: 'Johanna Lederwaren',
        address: 'manuel@ferlitsch.net',
      },
      to: 'ferlitsch.manuel@gmail.com',
      subject: 'SMTP Test Email',
      text: 'This is a test email to verify SMTP settings are working correctly.',
    });

    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('SMTP test failed:', error);
    throw error;
  }
}

// Export handler for Netlify
export async function handler(event, context) {
  try {
    const result = await testSMTP();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'SMTP test completed successfully', result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'SMTP test failed',
        error: error.message,
      }),
    };
  }
}
