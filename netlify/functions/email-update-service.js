// Import required libraries
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// SMTP transporter setup
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

// Supabase client setup
const supabase = createClient(
    'https://srcmwjxskrirwyttrsjm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY213anhza3Jpcnd5dHRyc2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU2ODYsImV4cCI6MjA1MjQ1MTY4Nn0.Q-tN2qjfIIFlnsU8xOeev3DtuPKeh8_Pnza1WzaYj0g'
);

// Main function to process database and send emails
export async function processAndSendEmails() {
    try {
        console.log('Fetching pending email entries...');

        // Fetch entries with status "pending"
        const { data: pendingEmails, error } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching pending emails:', error);
            throw new Error('Error reading from email_queue');
        }

        if (!pendingEmails || pendingEmails.length === 0) {
            console.log('No pending emails found.');
            return { success: true, message: 'No pending emails to process.' };
        }

        console.log(`Found ${pendingEmails.length} pending emails.`);

        // Process each pending email
        for (const emailEntry of pendingEmails) {
            const { id, to, subject, body } = emailEntry;

            try {
                // Send the email
                const info = await transporter.sendMail({
                    from: {
                        name: 'Johanna Lederwaren',
                        address: 'manuel@ferlitsch.net',
                    },
                    to,
                    subject,
                    text: body,
                });

                console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);

                // Update the status to "sent"
                const { error: updateError } = await supabase
                    .from('email_queue')
                    .update({ status: 'sent' })
                    .eq('id', id);

                if (updateError) {
                    console.error(`Error updating status for email ID ${id}:`, updateError);
                    throw new Error(`Failed to update status for email ID ${id}`);
                }

            } catch (emailError) {
                console.error(`Failed to send email to ${to}:`, emailError);
                // Optionally, update the status to "failed"
                await supabase
                    .from('email_queue')
                    .update({ status: 'failed' })
                    .eq('id', id);
            }
        }

        return { success: true, message: 'Emails processed successfully.' };

    } catch (err) {
        console.error('Error processing emails:', err);
        return { success: false, message: err.message };
    }
}

// Export handler for Netlify or similar platforms
export async function handler(event, context) {
    const result = await processAndSendEmails();
    return {
        statusCode: result.success ? 200 : 500,
        body: JSON.stringify(result),
    };
}
