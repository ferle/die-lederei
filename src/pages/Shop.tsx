import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import {query} from "express";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alle');
  const [isLoading, setIsLoading] = useState(true);
  const categories = ['alle', 'gürtel', 'taschen', 'schuhe', 'accessoires'];
  
  

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let query = supabase.from('products').select('*');
        
        if (selectedCategory !== 'alle') {
          query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-white">
      {/* Shop Header */}
      <header className="relative py-24 bg-burgundy-50">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <span className="font-typewriter text-burgundy-700 tracking-wider">Handgefertigt in Österreich</span>
          <h1 className="text-5xl mt-4 mb-6 text-burgundy-900">Unsere Kollektion</h1>
          <p className="text-lg text-burgundy-800/80 max-w-2xl mx-auto italic">
            Entdecken Sie unsere handgefertigten Lederwaren – jedes Stück ein Unikat, 
            gefertigt mit Liebe zum Detail und traditioneller Handwerkskunst.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-burgundy-700 text-white'
                  : 'bg-burgundy-50 text-burgundy-700 hover:bg-burgundy-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && <LoadingOverlay />}

        {/* Products Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          layout
          initial={false}
        >
          <AnimatePresence mode="popLayout">
            {!isLoading && products.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.3,
                    delay: index * 0.1 // Stagger the animations
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  y: -20,
                  transition: { duration: 0.2 }
                }}
                transition={{
                  layout: { 
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.6
                  }
                }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.image_url}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {!isLoading && products.length === 0 && (
          <motion.div 
            className="text-center py-12 text-burgundy-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg">Keine Produkte in dieser Kategorie gefunden.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}