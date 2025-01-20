import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, X, Mail, Pencil, Save, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

interface NewUserForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'admin'
  });
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
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role, created_at')
        .eq('role', 'admin');

      if (error) throw error;
      
      if (usersData) {
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email
    });
  };

  const handleSave = async () => {
    if (!editingUserId) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editForm.first_name || null,
          last_name: editForm.last_name || null,
          email: editForm.email
        })
        .eq('id', editingUserId);

      if (error) throw error;

      setEditingUserId(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User could not be created');

      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: newUserForm.first_name || null,
          last_name: newUserForm.last_name || null,
          email: newUserForm.email,
          role: 'admin'
        })
        .eq('id', authData.user.id);

      if (userError) throw userError;

      setNewUserForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'admin'
      });
      setShowNewUserForm(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
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
      {isLoading && <LoadingOverlay />}
      
      <AdminNav onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-typewriter text-burgundy-800">Administratoren</h1>
          <button
            onClick={() => setShowNewUserForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded hover:bg-burgundy-800 transition"
          >
            <UserPlus size={20} />
            Neuer Administrator
          </button>
        </div>

        {showNewUserForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Neuen Administrator anlegen</h2>
              <button
                onClick={() => setShowNewUserForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vorname
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.first_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nachname
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.last_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  E-Mail
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Passwort
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-burgundy-700 text-white rounded hover:bg-burgundy-800 transition"
                >
                  Administrator anlegen
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-Mail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registriert
                am
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Vorname"
                        />
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Nachname"
                        />
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{user.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {editingUserId === user.id ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900"
                          title="Änderungen speichern"
                        >
                          <Save size={20} />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Abbrechen"
                        >
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-burgundy-600 hover:text-burgundy-900"
                          title="Bearbeiten"
                        >
                          <Pencil size={20} />
                        </button>
                        <a
                          href={`mailto:${user.email}`}
                          className="text-burgundy-600 hover:text-burgundy-900 inline-block"
                          title="E-Mail senden"
                        >
                          <Mail size={20} />
                        </a>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Administratoren</h3>
              <p className="mt-1 text-sm text-gray-500">Fügen Sie neue Administratoren hinzu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}