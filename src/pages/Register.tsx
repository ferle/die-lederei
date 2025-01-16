import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  password: string;
  confirmPassword: string;
}

const initialForm: RegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: '',
  password: '',
  confirmPassword: ''
};

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addressInputRef = useGooglePlacesAutocomplete({
    onAddressSelect: (components) => {
      setForm(prev => ({
        ...prev,
        street: components.route,
        houseNumber: components.street_number,
        city: components.locality,
        postalCode: components.postal_code,
        country: components.country || ''
      }));
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Benutzer konnte nicht erstellt werden');

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          address: `${form.street} ${form.houseNumber}\n${form.postalCode} ${form.city}\n${form.country}`,
          role: 'user'
        });

      if (userError) throw userError;

      navigate('/login', { 
        state: { 
          message: 'Registrierung erfolgreich! Sie können sich jetzt anmelden.' 
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message === 'User already registered') {
        setError('Diese E-Mail-Adresse ist bereits registriert.');
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-burgundy-50 flex items-center justify-center px-4 py-12">
      {isLoading && <LoadingOverlay />}
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <Link to="/" className="text-3xl font-typewriter text-burgundy-800">Johanna</Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Registrieren</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Vorname*
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nachname*
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={form.lastName}
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
                id="email"
                name="email"
                type="email"
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
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adresse*
              </label>
              <input
                ref={addressInputRef}
                type="text"
                placeholder="Geben Sie eine Adresse ein..."
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Straße*
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  required
                  value={form.street}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div>
                <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700">
                  Hausnummer*
                </label>
                <input
                  id="houseNumber"
                  name="houseNumber"
                  type="text"
                  required
                  value={form.houseNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  PLZ*
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
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
                  id="city"
                  name="city"
                  type="text"
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
                id="country"
                name="country"
                type="text"
                required
                value={form.country}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort*
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Passwort bestätigen*
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-burgundy-700 hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-burgundy-500 transition"
            >
              Registrieren
            </button>

            <p className="text-center text-sm text-gray-600">
              Bereits registriert?{' '}
              <Link to="/login" className="font-medium text-burgundy-700 hover:text-burgundy-800">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}