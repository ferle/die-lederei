import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';

export function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
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
      setForm(prev => ({
        ...prev,
        address: `${components.route} ${components.street_number}`,
        city: components.locality,
        postalCode: components.postal_code,
        country: components.country || ''
      }));
    }
  });

  // Check cart contents
  useEffect(() => {
    if (items.length === 0 && hasCheckedCart) {
      navigate('/shop');
    }
    setHasCheckedCart(true);
  }, [items.length, hasCheckedCart, navigate]);

  // Load user data
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
      // Validate form
      if (!form.first_name || !form.last_name || !form.email || !form.address || !form.city || !form.postalCode || !form.country) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus.');
      }

      // Create order
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

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update user data if logged in
      if (user) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            address: `${form.address}\n${form.postalCode} ${form.city}\n${form.country}`
          })
          .eq('id', user.id);

        if (userError) throw userError;
      }

      // Clear cart and redirect to success page
      clearCart();
      navigate('/checkout/success', { 
        state: { 
          orderId: order.id,
          orderTotal: totalPrice()
        }
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Don't render anything until we've checked the cart
  if (!hasCheckedCart) return null;

  // If cart is empty, the useEffect will handle navigation
  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-burgundy-50 py-12">
      {isLoading && <LoadingOverlay />}
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {!user && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 mb-4">
              Sie können als Gast bestellen oder sich anmelden, um von den Vorteilen eines Kundenkontos zu profitieren.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                state={{ returnTo: '/checkout' }}
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
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="bg-white p-8 rounded-lg shadow-lg h-fit">
            <h2 className="text-2xl font-medium mb-6">Bestellübersicht</h2>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-200">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-burgundy-700 font-medium">
                      {(item.price / 100).toLocaleString('de-DE', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </p>
                    <p className="text-gray-600">Anzahl: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-lg font-medium">
                <span>Gesamtsumme</span>
                <span>
                  {(totalPrice() / 100).toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-medium mb-6">Ihre Daten</h2>

            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-4 rounded">
                {error}
              </div>
            )}
            
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

              <button
                type="submit"
                className="w-full py-3 px-4 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition"
              >
                Jetzt kostenpflichtig bestellen
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}