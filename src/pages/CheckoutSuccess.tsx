import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Mail, ArrowRight } from 'lucide-react';

interface LocationState {
  orderId: string;
  orderTotal: number;
}

export function CheckoutSuccess() {
  const location = useLocation();
  const state = location.state as LocationState;

  if (!state?.orderId) {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className="min-h-screen bg-burgundy-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Message */}
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-medium text-gray-900 mb-4">
            Vielen Dank für Ihre Bestellung!
          </h1>
          
          <div className="text-gray-600 mb-8">
            <p>Ihre Bestellnummer lautet: <strong className="text-burgundy-800">{state.orderId}</strong></p>
            <p className="mt-2">
              Gesamtbetrag: <strong className="text-burgundy-800">
                {(state.orderTotal / 100).toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                })}
              </strong>
            </p>
          </div>

          {/* Order Steps */}
          <div className="border-t border-b border-gray-200 py-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-burgundy-50 rounded-full flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6 text-burgundy-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">Bestätigung</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sie erhalten in Kürze eine Bestätigungs-E-Mail
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-burgundy-50 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-burgundy-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">Bearbeitung</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Wir bereiten Ihre Bestellung vor
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-burgundy-50 rounded-full flex items-center justify-center mb-3">
                  <Truck className="w-6 h-6 text-burgundy-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">Versand</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sie werden über den Versand informiert
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-4">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition"
            >
              Weiter einkaufen
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <p className="text-sm text-gray-600">
              Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns gerne unter{' '}
              <a 
                href="mailto:kontakt@johanna-leder.de" 
                className="text-burgundy-700 hover:text-burgundy-800"
              >
                kontakt@johanna-leder.de
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}