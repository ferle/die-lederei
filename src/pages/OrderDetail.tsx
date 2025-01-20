import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  product: {
    name: string;
    image_url: string;
  };
}

interface Order {
  phone: string | null;
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  notes: string | null;
  user_id: string | null;
  user?: {
    phone: string | null;
  };
}

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading, checkAdmin, signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            user:user_id (
              phone
            )
          `)
          .eq('id', id)
          .single();

        if (orderError) throw orderError;
        if (orderData) setOrder(orderData);

        // Fetch order items with product details
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`*`)
          .eq('order_id', "bd24f493-66a4-4295-8bae-414f6d55378c");
        
        console.log("order_id: " + id);
        console.log("items: " + itemsData);
        console.log(itemsError);
        
        if (itemsError) throw itemsError;
        if (itemsData) setOrderItems(itemsData);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, isAdmin, authLoading]);

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating order status:', error);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-burgundy-50">
        <AdminNav onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto py-12 px-6">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-burgundy-900">Bestellung nicht gefunden</h1>
          </div>
        </div>
      </div>
    );
  }

  const addressLines = order.shipping_address.split('\n');

  return (
    <div className="min-h-screen bg-burgundy-50 relative">
      {isLoading && <LoadingOverlay />}
      
      <AdminNav onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin/orders"
            className="text-burgundy-700 hover:text-burgundy-800 transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-typewriter text-burgundy-900">
            Bestellung #{order.id.slice(0, 8)}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status and Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-4">Status</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleStatusUpdate('pending')}
                  className={`px-4 py-2 rounded-lg transition ${
                    order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-white text-gray-700 hover:bg-yellow-50'
                  }`}
                >
                  <Clock className="w-5 h-5 inline-block mr-2" />
                  Ausstehend
                </button>
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  className={`px-4 py-2 rounded-lg transition ${
                    order.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  <Clock className="w-5 h-5 inline-block mr-2" />
                  In Bearbeitung
                </button>
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className={`px-4 py-2 rounded-lg transition ${
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-white text-gray-700 hover:bg-green-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
                  Abgeschlossen
                </button>
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  className={`px-4 py-2 rounded-lg transition ${
                    order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white text-gray-700 hover:bg-red-50'
                  }`}
                >
                  <XCircle className="w-5 h-5 inline-block mr-2" />
                  Storniert
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-4">Bestellte Artikel</h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b border-gray-200 last:border-0">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-burgundy-700 font-medium">
                        {(item.price_at_time / 100).toLocaleString('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </p>
                      <p className="text-gray-600">Anzahl: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-medium text-burgundy-900 mb-4">Anmerkungen</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-4">Kundeninformationen</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1">{order.customer_name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kontakt</h3>
                  <div className="mt-1 space-y-2">
                    <a
                      href={`mailto:${order.customer_email}`}
                      className="flex items-center text-burgundy-700 hover:text-burgundy-800"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {order.customer_email}
                    </a>
                    {order.phone && (
                      <a
                        href={`tel:${order.user?.phone}`}
                        className="flex items-center text-burgundy-700 hover:text-burgundy-800"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {order.phone}
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Lieferadresse</h3>
                  <div className="mt-1 flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-1 text-burgundy-700" />
                    <div>
                      {addressLines.map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Bestellt am</h3>
                  <p className="mt-1">
                    {new Date(order.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-4">Zusammenfassung</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Gesamtsumme</span>
                  <span>
                    {(order.total_amount / 100).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}