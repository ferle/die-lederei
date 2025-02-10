import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface LocationState {
  message?: string;
  returnTo?: string;
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuthStore();
  const state = location.state as LocationState;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await signIn(email, password, rememberMe);
      navigate(state?.returnTo || '/admin');
    } catch (err) {
      setError('Ungültige Anmeldedaten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-burgundy-50 flex items-center justify-center px-4 pb-96">
      {isLoading && <LoadingOverlay />}
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg vintage-border">
        <div className="text-center">
          <Link to="/" className="text-3xl font-typewriter text-burgundy-800">Johanna</Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Anmelden</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {state?.message && (
            <div className="bg-green-50 text-green-700 p-3 rounded text-center">
              {state.message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-burgundy-600 focus:ring-burgundy-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Angemeldet bleiben
              </label>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-burgundy-700 hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-burgundy-500 transition"
            >
              Anmelden
            </button>

            <p className="text-center text-sm text-gray-600">
              Noch kein Konto?{' '}
              <Link to="/register" className="font-medium text-burgundy-700 hover:text-burgundy-800">
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}