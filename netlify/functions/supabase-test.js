// Import required libraries
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabase = createClient(
    'https://srcmwjxskrirwyttrsjm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY213anhza3Jpcnd5dHRyc2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU2ODYsImV4cCI6MjA1MjQ1MTY4Nn0.Q-tN2qjfIIFlnsU8xOeev3DtuPKeh8_Pnza1WzaYj0g'
);

exports.handler = async (event, context) => {
    try {
        // Fetch data from the "email_queue" table
        const { data, error } = await supabase
            .from('email_queue')
            .select('*');

        if (error) {
            console.error('Error reading from email_queue:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Error reading from email_queue', error: error.message })
            };
        }

        // Return the data from the table
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Successfully retrieved data', data })
        };
    } catch (err) {
        console.error('Unexpected error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Unexpected error occurred', error: err.message })
        };
    }
};


