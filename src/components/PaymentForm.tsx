import React, { useState } from "react";
import {
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";

const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [amount, setAmount] = useState(1000); // Amount in cents (e.g., $10)
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            alert("Stripe.js has not loaded yet.");
            return;
        }

        setIsProcessing(true);
        try {
            // Step 1: Create a payment intent on the server
            const response = await axios.post("/create-payment-intent", {
                amount, // Amount in cents
                currency: "usd",
            });

            const clientSecret = response.data.clientSecret;

            // Step 2: Use Stripe.js to confirm the payment
            const paymentResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: "John Doe",
                    },
                },
            });

            if (paymentResult.error) {
                alert(`Payment failed: ${paymentResult.error.message}`);
            } else {
                alert("Payment successful!");
            }
        } catch (error: any) {
            alert(`An error occurred: ${error.message}`);
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handlePayment}>
            <h2>Stripe Payment</h2>
            <CardElement />
            <div>
                <label>
                    Amount (cents):
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                    />
                </label>
            </div>
            <button type="submit" disabled={!stripe || isProcessing}>
                {isProcessing ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
};

export default PaymentForm;