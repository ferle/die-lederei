import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export function Cart() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-burgundy-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-burgundy-300 mb-6" />
            <h2 className="text-2xl font-medium text-burgundy-900 mb-4">
              Ihr Warenkorb ist leer
            </h2>
            <p className="text-gray-600 mb-8">
              Entdecken Sie unsere handgefertigten Produkte und füllen Sie Ihren Warenkorb mit einzigartigen Stücken.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Zum Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burgundy-50 py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-typewriter text-burgundy-900">Warenkorb</h1>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-burgundy-700 hover:text-burgundy-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Weiter einkaufen
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-6 flex gap-6"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-burgundy-900">
                        {item.name}
                      </h3>
                      <p className="text-burgundy-700 font-medium">
                        {(item.price / 100).toLocaleString('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 transition"
                      aria-label="Artikel entfernen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="p-1 rounded-full hover:bg-burgundy-50 text-burgundy-700"
                      aria-label="Menge reduzieren"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-burgundy-50 text-burgundy-700"
                      aria-label="Menge erhöhen"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-medium text-burgundy-900 mb-6">
              Zusammenfassung
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Zwischensumme</span>
                <span>
                  {(totalPrice() / 100).toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Versand</span>
                <span>Kostenlos</span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-lg font-medium text-burgundy-900">
                  <span>Gesamtsumme</span>
                  <span>
                    {(totalPrice() / 100).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-8 w-full inline-flex justify-center items-center px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition"
            >
              Zur Kasse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}