import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pencil, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  article_number: string;
  added_date: string;
}

type SortField = 'article_number' | 'name' | 'price' | 'stock' | 'category' | 'added_date';
type SortDirection = 'asc' | 'desc';

export function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('added_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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

    fetchProducts();
  }, [isAdmin, authLoading, sortField, sortDirection]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock, category, article_number, added_date')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Produkt löschen möchten?')) return;
    
    await supabase.from('products').delete().eq('id', id);
    setProducts(products.filter(p => p.id !== id));
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
          <h1 className="text-3xl font-typewriter text-burgundy-800">Produkte</h1>
          <button
            onClick={() => navigate('/admin/product/new')}
            className="flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded hover:bg-burgundy-800 transition"
          >
            <Plus size={20} />
            Neues Produkt
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('article_number')}
                >
                  <div className="flex items-center gap-1">
                    Artikelnr.
                    <SortIcon field="article_number" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    Preis
                    <SortIcon field="price" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center gap-1">
                    Lagerbestand
                    <SortIcon field="stock" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Kategorie
                    <SortIcon field="category" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('added_date')}
                >
                  <div className="flex items-center gap-1">
                    Hinzugefügt am
                    <SortIcon field="added_date" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {product.article_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(product.price / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(product.added_date).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => navigate(`/admin/product/${product.id}`)}
                      className="text-burgundy-600 hover:text-burgundy-900 mr-4"
                      title="Produkt bearbeiten"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Produkt löschen"
                    >
                      <Trash2 size={20} />
                    </button>
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