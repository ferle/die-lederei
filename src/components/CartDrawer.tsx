import React from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium">Warenkorb</h2>
            <Link
              to="/cart"
              onClick={onClose}
              className="text-sm text-burgundy-700 hover:text-burgundy-800 transition"
            >
              Warenkorb bearbeiten
            </Link>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Warenkorb schließen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Ihr Warenkorb ist leer
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-200">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-burgundy-700 font-medium">
                      {(item.price / 100).toLocaleString('de-DE', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="p-1 rounded-full hover:bg-gray-100"
                        aria-label="Menge reduzieren"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                        aria-label="Menge erhöhen"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-1 text-red-600 hover:text-red-700"
                        aria-label="Artikel entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between mb-4">
            <span className="font-medium">Gesamtsumme</span>
            <span className="font-medium">
              {(totalPrice() / 100).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </span>
          </div>
          
          <button
            onClick={handleCheckout}
            className="w-full py-3 px-4 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={items.length === 0}
          >
            Zur Kasse
          </button>
        </div>
      </div>
    </div>
  );
}