import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Mail, Phone, Users, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  role: string;
}

export function Customers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'customers' | 'admins'>('all');
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading, checkAdmin, signOut } = useAuthStore();

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [isAdmin, authLoading]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'customers') return user.role === 'user';
    if (filter === 'admins') return user.role === 'admin';
    return true;
  });

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-burgundy-50 relative">
      {isLoading && <LoadingOverlay />}
      
      <AdminNav onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-typewriter text-burgundy-800">Benutzerverwaltung</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-burgundy-700 text-white'
                  : 'bg-white text-burgundy-700 hover:bg-burgundy-50'
              }`}
            >
              Alle Benutzer
            </button>
            <button
              onClick={() => setFilter('customers')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'customers'
                  ? 'bg-burgundy-700 text-white'
                  : 'bg-white text-burgundy-700 hover:bg-burgundy-50'
              }`}
            >
              Nur Kunden
            </button>
            <button
              onClick={() => setFilter('admins')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'admins'
                  ? 'bg-burgundy-700 text-white'
                  : 'bg-white text-burgundy-700 hover:bg-burgundy-50'
              }`}
            >
              Nur Administratoren
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registriert am</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail size={16} className="mr-2" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone size={16} className="mr-2" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{user.address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-burgundy-600 mr-2" />
                      ) : (
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                      )}
                      <span className="text-sm">
                        {user.role === 'admin' ? 'Administrator' : 'Kunde'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      to={`/admin/customers/${user.id}`}
                      className="text-burgundy-600 hover:text-burgundy-900"
                    >
                      <Eye size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benutzer</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'customers' 
                  ? 'Es wurden noch keine Kunden registriert.'
                  : filter === 'admins'
                    ? 'Es wurden noch keine Administratoren angelegt.'
                    : 'Es wurden noch keine Benutzer registriert.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}