import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import axios from 'axios'; // To handle API calls
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';

export function Checkout() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasCheckedCart, setHasCheckedCart] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    notes: ''
  });

  const addressInputRef = useGooglePlacesAutocomplete({
    onAddressSelect: (components) => {
      setForm((prev) => ({
        ...prev,
        address: `${components.route} ${components.street_number}`,
        city: components.locality,
        postalCode: components.postal_code,
        country: components.country || ''
      }));
    }
  });

  // Fetch the clientSecret from the backend when the component mounts
  useEffect(() => {
    async function fetchClientSecret() {
      try {
        setIsLoading(true);
        const { data } = await axios.post('http://localhost:3001/create-payment-intent', {
          amount: totalPrice(),
          currency: 'eur',
          // amount: totalPrice(), // Pass the total price in cents
          // currency: 'eur', // Adjust currency if necessary
        });
        console.log(data);
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.log(err);
        setError('Fehler beim Initialisieren der Zahlung. Bitte versuchen Sie es später erneut.');
      } finally {
        setIsLoading(false);
      }
    }

    if (items.length > 0) {
      fetchClientSecret();
    } else {
      navigate('/shop');
    }
  }, [items.length, navigate, totalPrice]);

  useEffect(() => {
    if (items.length === 0 && hasCheckedCart) {
      navigate('/shop');
    }
    setHasCheckedCart(true);
  }, [items.length, hasCheckedCart, navigate]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        if (userData) {
          const addressParts = userData.address?.split('\n') || [];
          const cityParts = addressParts[1]?.split(' ') || [];

          setForm({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: addressParts[0] || '',
            postalCode: cityParts[0] || '',
            city: cityParts.slice(1).join(' ') || '',
            country: addressParts[2] || '',
            notes: ''
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe ist nicht verfügbar. Bitte versuchen Sie es später erneut.');
      }

      // Confirm payment with Stripe
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/CheckoutSuccess`, // Redirect URL on success
          receipt_email: form.email, // Optional: Send receipt to this email
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Create order in the database
      const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: `${form.first_name} ${form.last_name}`,
            customer_email: form.email,
            shipping_address: `${form.address}\n${form.postalCode} ${form.city}\n${form.country}`,
            total_amount: totalPrice(),
            notes: form.notes,
            user_id: user?.id || null
          })
          .select()
          .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasCheckedCart) return null;

  if (items.length === 0) return null;

  return (
      <div className="min-h-screen bg-burgundy-50 py-12">
        {isLoading && <LoadingOverlay />}

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-lg h-fit">
              <h2 className="text-2xl font-medium mb-6">Bestellübersicht</h2>
              {items.length === 0 ? (
                  <p className="text-gray-600">Ihr Warenkorb ist leer.</p>
              ) : (
                  <ul>
                    {items.map((item) => (
                        <li key={item.id} className="flex justify-between items-center mb-4">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} x €{(item.price / 100).toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold">€{((item.price * item.quantity) / 100).toFixed(2)}</p>
                        </li>
                    ))}
                  </ul>
              )}

              <div className="border-t mt-4 pt-4">
                <p className="font-medium text-lg">Gesamt: €{(totalPrice() / 100).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-medium mb-6">Ihre Zahlungsdaten</h2>

              {error && (
                  <div className="mb-6 bg-red-50 text-red-700 p-4 rounded">
                    {error}
                  </div>
              )}

              {clientSecret ? (
                  <form onSubmit={handleSubmit}>
                    <PaymentElement />
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition mt-4"
                    >
                      Zahlung bestätigen
                    </button>
                  </form>
              ) : (
                  <p>Lade Zahlungsdaten...</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
