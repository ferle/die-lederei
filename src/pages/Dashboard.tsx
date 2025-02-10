import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Tag, Users, BarChart3, Settings, ShoppingBag, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface DashboardStats {
  products: number;
  categories: number;
  orders: number;
  customers: number;
  admins: number;
}

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  to: string;
}

function DashboardCard({ title, value, icon, description, to }: DashboardCardProps) {
  return (
    <Link 
      to={to}
      className="relative overflow-hidden bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-burgundy-50 rounded-full transform group-hover:scale-110 transition-transform duration-300" />
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="p-3 bg-burgundy-50 rounded-lg">
            {React.cloneElement(icon as React.ReactElement, { 
              size: 28,
              className: "text-burgundy-700"
            })}
          </div>
          <div className="text-4xl font-bold text-burgundy-800">{value}</div>
        </div>
        <h3 className="text-xl font-medium text-burgundy-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading, checkAdmin, signOut } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    categories: 0,
    orders: 0,
    customers: 0,
    admins: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAdmin();
    };
    init();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAdmin) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [
          productsResponse,
          categoriesResponse,
          ordersResponse,
          customersResponse,
          adminsResponse
        ] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact' }),
          supabase.from('categories').select('id', { count: 'exact' }),
          supabase.from('orders').select('id', { count: 'exact' }),
          supabase.from('users').select('id', { count: 'exact' }).eq('role', 'user'),
          supabase.from('users').select('id', { count: 'exact' }).eq('role', 'admin')
        ]);

        setStats({
          products: productsResponse.count || 0,
          categories: categoriesResponse.count || 0,
          orders: ordersResponse.count || 0,
          customers: customersResponse.count || 0,
          admins: adminsResponse.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading || !isAdmin) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen bg-burgundy-50 relative">
      {isLoading && <LoadingOverlay />}
      
      <AdminNav onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto py-16 px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-typewriter text-burgundy-800 mb-4">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DashboardCard
            title="Produkte"
            value={stats.products}
            icon={<Package />}
            description="Verwalten Sie Ihr Produktsortiment"
            to="/admin/products"
          />
          <DashboardCard
            title="Kategorien"
            value={stats.categories}
            icon={<Tag />}
            description="Organisieren Sie Ihre Produktkategorien"
            to="/admin/categories"
          />
          <DashboardCard
            title="Bestellungen"
            value={stats.orders}
            icon={<ShoppingBag />}
            description="Übersicht aller Bestellungen"
            to="/admin/orders"
          />
          <DashboardCard
            title="Kunden"
            value={stats.customers}
            icon={<Users />}
            description="Verwalten Sie Ihre Kundendaten"
            to="/admin/customers"
          />
          <DashboardCard
            title="Administratoren"
            value={stats.admins}
            icon={<Shield />}
            description="Verwalten Sie Administratoren"
            to="/admin/users"
          />
          <DashboardCard
            title="Einstellungen"
            value="-"
            icon={<Settings />}
            description="Konfigurieren Sie Ihren Shop"
            to="/admin/settings"
          />
        </div>
      </div>
    </div>
  );
}