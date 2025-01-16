import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
}

function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const labels = {
    pending: 'Ausstehend',
    processing: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

    fetchOrders();
  }, [isAdmin, authLoading]);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    fetchOrders();
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
          <h1 className="text-3xl font-typewriter text-burgundy-800">Bestellungen</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bestellnummer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-burgundy-800">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{order.customer_name}</div>
                    <div className="text-gray-500 text-sm">{order.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {(order.total_amount / 100).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'processing')}
                      className="text-blue-600 hover:text-blue-900"
                      title="In Bearbeitung setzen"
                    >
                      <Clock size={20} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      className="text-green-600 hover:text-green-900"
                      title="Als abgeschlossen markieren"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                      className="text-red-600 hover:text-red-900"
                      title="Stornieren"
                    >
                      <XCircle size={20} />
                    </button>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="inline-block text-burgundy-600 hover:text-burgundy-900"
                      title="Details anzeigen"
                    >
                      <Eye size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <Eye className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Bestellungen</h3>
              <p className="mt-1 text-sm text-gray-500">Es wurden noch keine Bestellungen aufgegeben.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}