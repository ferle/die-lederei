import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  created_at: string;
}

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading, checkAdmin, signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: ''
  });

  const addressInputRef = useGooglePlacesAutocomplete({
    onAddressSelect: (components) => {
      setForm(prev => ({
        ...prev,
        street: components.route || '',
        houseNumber: components.street_number || '',
        city: components.locality || '',
        postalCode: components.postal_code || '',
        country: components.country || ''
      }));
    }
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (userData) {
          setUser(userData);
          
          // Parse address into components
          const addressParts = userData.address?.split('\n') || [];
          const streetParts = addressParts[0]?.split(' ') || [];
          const cityParts = addressParts[1]?.split(' ') || [];
          
          setForm({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            street: streetParts.slice(0, -1).join(' ') || '',
            houseNumber: streetParts[streetParts.length - 1] || '',
            postalCode: cityParts[0] || '',
            city: cityParts.slice(1).join(' ') || '',
            country: addressParts[2] || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id, isAdmin, authLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          email: form.email,
          phone: form.phone || null,
          address: `${form.street} ${form.houseNumber}\n${form.postalCode} ${form.city}\n${form.country}`
        })
        .eq('id', id);

      if (error) throw error;

      setSuccessMessage('Änderungen wurden erfolgreich gespeichert.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-burgundy-50 relative">
      {(isLoading || isSaving) && <LoadingOverlay />}
      
      <AdminNav onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/customers"
              className="text-burgundy-700 hover:text-burgundy-800 transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-typewriter text-burgundy-900">
              Benutzer bearbeiten
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {successMessage && (
              <span className="text-green-600">{successMessage}</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vorname
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nachname
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse suchen
              </label>
              <input
                ref={addressInputRef}
                type="text"
                placeholder="Geben Sie eine Adresse ein..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Straße
                </label>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hausnummer
                </label>
                <input
                  type="text"
                  value={form.houseNumber}
                  onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}