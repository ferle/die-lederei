import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { transformImageUrl } from '../utils/imageHandler';

interface Settings {
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  about_short: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  product_images: {
    url: string;
    is_default: boolean;
  }[];
}

export function Home() {
  const [settings, setSettings] = useState<Settings>({
    hero_title: 'Handgefertigte Lederwaren mit Charakter',
    hero_subtitle: 'Entdecken Sie meine handgefertigten Lederwaren – jedes Stück ein Unikat, gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.',
    hero_cta: 'Zum Shop',
    about_short: ''
  });
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settingsResponse, productsResponse] = await Promise.all([
          supabase
            .from('settings')
            .select('hero_title, hero_subtitle, hero_cta, about_short')
            .single(),
          supabase
            .from('products')
            .select(`
              id,
              name,
              description,
              price,
              product_images (
                url,
                is_default
              )
            `)
            .eq('featured', true)
            .order('added_date', { ascending: false })
            .limit(4)
        ]);
        
        if (settingsResponse.data) {
          setSettings(settingsResponse.data);
        }

        if (productsResponse.data) {
          setFeaturedProducts(productsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-32 bg-burgundy-50">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1573227896778-8f378c4029d4')] bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.h1 
              className="text-6xl font-typewriter text-burgundy-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {settings.hero_title}
            </motion.h1>
            <motion.p 
              className="text-xl text-burgundy-800/80 mb-8 italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {settings.hero_subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-8 py-4 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition-colors"
              >
                {settings.hero_cta}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-typewriter text-burgundy-900 mb-4">
            Ausgewählte Produkte
          </h2>
          <p className="text-lg text-burgundy-800/80 italic max-w-2xl mx-auto">
            Entdecken Sie meine handverlesenen Highlights – jedes Stück ein Unikat traditioneller Handwerkskunst
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product, index) => {
            const defaultImage = product.product_images.find(img => img.is_default) || product.product_images[0];
            const imageUrl = transformImageUrl(defaultImage?.url, {
              size: 'medium',
              quality: 85,
              format: 'webp'
            });

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  to={`/shop/product/${product.id}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-typewriter text-burgundy-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-burgundy-700 font-medium">
                    {(product.price / 100).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-burgundy-50 text-burgundy-700 rounded-lg hover:bg-burgundy-100 transition-colors"
          >
            Alle Produkte entdecken
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="über-mich" className="py-24 bg-burgundy-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-burgundy-800/80 mb-8 font-typewriter font-medium">
              {settings.about_short}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-burgundy-700 hover:text-burgundy-800 transition"
            >
              Mehr erfahren
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}