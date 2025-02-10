import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Menu, X, ShoppingBag, LogIn, UserRound } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { Logo } from './components/Logo';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Admin } from './pages/Admin';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Customers } from './pages/Customers';
import { UserDetail } from './pages/UserDetail';
import { ProductForm } from './pages/ProductForm';
import { AdminUsers } from './pages/AdminUsers';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProductDetail } from './pages/ProductDetail';
import { About } from './pages/About';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Settings } from './pages/Settings';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';

const stripePromise = loadStripe('pk_test_51QilW7PxH6E6bhVrJ6AR8hWV3fNks7Ki3OItqfP9v6ymEriL7xg4Qx6S2mpnkQadsClFGMpN4VDekv50tlumSAxT00NOm6cL93');

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAdmin, user } = useAuthStore();
  const { totalItems, totalPrice } = useCartStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:8888/.netlify/functions/server'
        : 'https://die-lederei.netlify.app/.netlify/functions/server';

    async function fetchClientSecret() {
      try {
        const { data } = await axios.post(`${baseURL}/create-payment-intent`, {
          amount: 1000,
          currency: 'eur',
        });
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error fetching client secret:', err);
        setError('Fehler beim Initialisieren der Zahlung. Bitte versuchen Sie es später erneut.');
      }
    }

    fetchClientSecret();
  }, [totalPrice]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!clientSecret) {
    return <div></div>;
  }

  return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-stone-200">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="flex items-center justify-end h-24">
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-12 text-lg tracking-wide text-burgundy-800">
                  <Link to="/" className="hover:text-burgundy-600 transition">Startseite</Link>
                  <Link to="/shop" className="hover:text-burgundy-600 transition">Shop</Link>
                  <Link to="/about" className="hover:text-burgundy-600 transition">Über mich</Link>
                  {isAdmin && (
                      <Link to="/admin" className="hover:text-burgundy-600 transition">
                        Admin
                      </Link>
                  )}
                </nav>

                {/* Cart & Account */}
                <div className="hidden md:flex items-center space-x-6 ml-12">
                  <button
                      onClick={() => setIsCartOpen(true)}
                      className="relative text-burgundy-800 hover:text-burgundy-600 transition"
                  >
                    <ShoppingBag className="w-6 h-6" />
                    {totalItems() > 0 && (
                        <span className="absolute -top-2 -right-2 bg-burgundy-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {totalItems()}
                    </span>
                    )}
                  </button>
                  {user ? (
                      <div className="text-sm text-burgundy-800">
                        {user.email}
                      </div>
                  ) : (
                      <Link to="/login" className="text-burgundy-800 hover:text-burgundy-600 transition">
                        <UserRound className="w-6 h-6" />
                      </Link>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-burgundy-800 hover:text-burgundy-600 transition"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <nav className="md:hidden bg-white border-b border-stone-200 p-5">
                  <ul className="space-y-4 text-lg text-burgundy-800 text-right">
                    <li>
                      <Link
                          to="/"
                          className="block hover:text-burgundy-600 transition"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Startseite
                      </Link>
                    </li>
                    <li>
                      <Link
                          to="/shop"
                          className="block hover:text-burgundy-600 transition"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Shop
                      </Link>
                    </li>
                    <li>
                      <Link
                          to="/about"
                          className="block hover:text-burgundy-600 transition"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Über mich
                      </Link>
                    </li>
                    {isAdmin && (
                        <li>
                          <Link
                              to="/admin"
                              className="block hover:text-burgundy-600 transition"
                              onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Admin
                          </Link>
                        </li>
                    )}
                  </ul>
                </nav>
            )}

            {/* Overlapping Logo */}
            <div className="absolute left-12 lg:left-24 top-2">
              <Logo size="large" />
            </div>
          </header>

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/product/:id" element={<ProductDetail />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Admin />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/orders/:id" element={<OrderDetail />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/customers/:id" element={<UserDetail />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/product/:id" element={<ProductForm />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkoutsuccess" element={<CheckoutSuccess />} />
            </Routes>
          </main>

          <Footer />
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
      </Elements>
  );
}
