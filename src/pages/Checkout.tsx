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

        // Determine backend URL dynamically
        const baseURL =
            window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : 'https://die-lederei.netlify.app/.netlify/functions/server/create-payment-intent'; // Replace with your Netlify site domain

        // Send request to backend
        const { data } = await axios.post(`${baseURL}/create-payment-intent`, {
          amount: totalPrice(), // Pass the total price in cents
          currency: 'eur',      // Adjust currency if necessary
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
        console.log(error);
        
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

      if (!form.first_name || !form.last_name || !form.email || !form.address || !form.city || !form.postalCode || !form.country) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus.');
      }
      
      // Create order in the database
      const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: `${form.first_name} ${form.last_name}`,
            customer_email: form.email,
            shipping_address: `${form.address}\n${form.postalCode} ${form.city}\n${form.country}`,
            total_amount: totalPrice(),
            notes: form.notes || 'EMPTY',
            user_id: user?.id || null,
            customer_phone: form.phone || null,
            status: 'pending', // Default status for new orders
            created_at: new Date().toISOString(), // Add created_at field
          })
          .select()
          .single();

      console.log(orderError);
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
      
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
    
    
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  if (!hasCheckedCart) return null;

  if (items.length === 0) return null;

  return (
      
      <div className="min-h-screen bg-burgundy-50 py-12">
        {isLoading && <LoadingOverlay />}

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
            {/*Login / Register*/}
            <div className="bg-white p-8 rounded-lg shadow-lg h-fit text-center">
              <p className="text-gray-600 mb-4">
                Sie können als Gast bestellen oder sich anmelden, um von den Vorteilen eines Kundenkontos zu
                profitieren.
              </p>
              <div className="flex justify-center gap-4">
                <Link
                    to="/login"
                    state={{returnTo: '/checkout'}}
                    className="px-6 py-2 bg-burgundy-700 text-white rounded hover:bg-burgundy-800 transition"
                >
                  Anmelden
                </Link>
                <Link
                    to="/register"
                    className="px-6 py-2 bg-burgundy-50 text-burgundy-700 rounded hover:bg-burgundy-100 transition"
                >
                  Registrieren
                </Link>
              </div>
            </div>
            {/*Form Data*/}
            <div className="bg-white p-8 rounded-lg shadow-lg h-fit">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      Vorname*
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        required
                        value={form.first_name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Nachname*
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        required
                        value={form.last_name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-Mail*
                  </label>
                  <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Straße und Hausnummer*
                  </label>
                  <input
                      ref={addressInputRef}
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={form.address}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      PLZ*
                    </label>
                    <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        required
                        value={form.postalCode}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Ort*
                    </label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        required
                        value={form.city}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Land*
                  </label>
                  <input
                      type="text"
                      id="country"
                      name="country"
                      required
                      value={form.country}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Anmerkungen
                  </label>
                  <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                {/*<button*/}
                {/*    type="submit"*/}
                {/*    className="w-full py-3 px-4 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition"*/}
                {/*>*/}
                {/*  Jetzt kostenpflichtig bestellen*/}
                {/*</button>*/}
              </form>
            </div>
            {/*Bestellübersicht*/}
            <div className="bg-white p-8 rounded-lg shadow-lg h-fit">
              <h2 className="text-2xl font-medium mb-6">Bestellübersicht</h2>
              {items.length === 0 ? (
                  <p className="text-gray-600">Ihr Warenkorb ist leer.</p>
              ) : (
                  <ul>
                    {items.map((item) => (
                        <li key={item.id} className="flex justify-between items-center mb-4">
                          {/* Image Section */}
                          <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden">
                              <img
                                  src="https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&amp;fit=crop&amp;q=85&amp;fm=webp"
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-md"
                                  loading="lazy"
                              />
                            </div>
                            {/* Text Section */}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                {item.quantity} x €{(item.price / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Price Section */}
                          <p className="font-bold">€{((item.price * item.quantity) / 100).toFixed(2)}</p>
                        </li>

                    ))}
                  </ul>
              )}

              <div className="border-t mt-4 pt-4 text-right">
                <p className="text-lg font-bold">Gesamt: €{(totalPrice() / 100).toFixed(2)}</p>
              </div>
            </div>
            {/*Payment*/}
            <div className="bg-white p-8 rounded-lg shadow-lg h-fit">
              <h2 className="text-2xl font-medium mb-6">Ihre Zahlungsdaten</h2>

              {error && (
                  <div className="mb-6 bg-red-50 text-red-700 p-4 rounded">
                    {error}
                  </div>
              )}

              {clientSecret ? (
                  <form onSubmit={handleSubmit}>
                    <PaymentElement/>
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
