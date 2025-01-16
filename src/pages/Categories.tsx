import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '' });
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

    fetchCategories();
  }, [isAdmin, authLoading]);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
    setIsLoading(false);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    await supabase
      .from('categories')
      .update({
        name: editForm.name,
        slug: editForm.slug,
        description: editForm.description
      })
      .eq('id', editingId);

    setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) return;
    
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
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
          <h1 className="text-3xl font-typewriter text-burgundy-800">Kategorien</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      category.slug
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      category.description
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {editingId === category.id ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900 mr-4"
                          title="Änderungen speichern"
                        >
                          <Save size={20} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Abbrechen"
                        >
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-burgundy-600 hover:text-burgundy-900 mr-4"
                          title="Kategorie bearbeiten"
                        >
                          <Pencil size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Kategorie löschen"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}