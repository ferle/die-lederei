import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51QilW7PxH6E6bhVrYfEkHnbvhtJhZQ6qQ4xT6SQq7oLaV8T9fMhlHRod3uniy1gza3U2MyBOQ2dUF5gXGnIQL2Ky001QhWZkWy', { apiVersion: '2022-11-15' });

const app = express();

app.use(cors());
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
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

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
