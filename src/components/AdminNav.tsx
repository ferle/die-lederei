import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Tag, 
  Package, 
  ShoppingBag, 
  Users, 
  Shield,
  Settings,
  LogOut 
} from 'lucide-react';

interface AdminNavProps {
  onLogout: () => void;
}

export function AdminNav({ onLogout }: AdminNavProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Produkte' },
    { path: '/admin/categories', icon: Tag, label: 'Kategorien' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Bestellungen' },
    { path: '/admin/customers', icon: Users, label: 'Kunden' },
    { path: '/admin/users', icon: Shield, label: 'Administratoren' },
    { path: '/admin/settings', icon: Settings, label: 'Einstellungen' }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-burgundy-800 text-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-end">
        <div className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 transition-colors ${
                isActive(item.path) 
                  ? 'text-white' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Abmelden</span>
          </button>
        </div>
      </div>
    </nav>
  );
}