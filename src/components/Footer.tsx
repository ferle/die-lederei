import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-typewriter text-burgundy-800">
              Johanna
            </Link>
            <p className="text-gray-600 mt-4">
              Handgefertigte Lederwaren mit Charakter – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail.
            </p>
            <div className="flex space-x-4 text-burgundy-700">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-burgundy-800 transition"
              >
                <Instagram />
              </a>
              <a 
                href="mailto:kontakt@johanna-leder.de"
                className="hover:text-burgundy-800 transition"
              >
                <Mail />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium text-lg text-burgundy-900 mb-4">Navigation</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link to="/" className="hover:text-burgundy-700 transition">Startseite</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-burgundy-700 transition">Shop</Link>
              </li>
              <li>
                <a href="/#über-mich" className="hover:text-burgundy-700 transition">Über mich</a>
              </li>
              <li>
                <a href="/#kontakt" className="hover:text-burgundy-700 transition">Kontakt</a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-medium text-lg text-burgundy-900 mb-4">Kategorien</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link to="/shop?category=gürtel" className="hover:text-burgundy-700 transition">Gürtel</Link>
              </li>
              <li>
                <Link to="/shop?category=taschen" className="hover:text-burgundy-700 transition">Taschen</Link>
              </li>
              <li>
                <Link to="/shop?category=schuhe" className="hover:text-burgundy-700 transition">Schuhe</Link>
              </li>
              <li>
                <Link to="/shop?category=accessoires" className="hover:text-burgundy-700 transition">Accessoires</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-medium text-lg text-burgundy-900 mb-4">Kontakt</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-burgundy-700" />
                <span>Lederweg 1, 80331 München</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-burgundy-700" />
                <span>+49 (0) 89 123456</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-burgundy-700" />
                <span>kontakt@johanna-leder.de</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-600">
            <div>
              © {new Date().getFullYear()} Johanna Lederwaren. Alle Rechte vorbehalten.
            </div>
            <div className="flex space-x-6">
              <Link to="/datenschutz" className="hover:text-burgundy-700 transition">
                Datenschutz
              </Link>
              <Link to="/impressum" className="hover:text-burgundy-700 transition">
                Impressum
              </Link>
              <Link to="/agb" className="hover:text-burgundy-700 transition">
                AGB
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}