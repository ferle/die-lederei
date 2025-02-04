import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import serverless from 'serverless-http';

// Use Netlify environment variables for security
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Base route to test if function is running
app.get('/', (req, res) => {
    res.json({ message: "Netlify Stripe function is running!" });
});

// ✅ Fix: Use `/` for the function to work with Netlify’s path
const router = express.Router();
router.post('/server/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        if (!amount || !currency) {
            return res.status(400).json({ error: 'Amount and currency are required.' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating PaymentIntent:', error.message);
        res.status(500).json({ error: 'Failed to create payment intent.' });
    }
});

// ✅ Attach the router under `/`
app.use('/.netlify/functions/server', router);

// Export for Netlify function
export const handler = serverless(app);
