import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useCartStore } from '../store/cartStore';
import { transformImageUrl } from '../utils/imageHandler';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: Array<{
    id: string;
    url: string;
    is_default: boolean;
    order: number;
  }>;
}

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem } = useCartStore();

  // Use useMemo for image URLs to avoid recalculating on every render
  const mainImageUrl = useMemo(() => {
    const url = product?.images[currentImageIndex]?.url;
    if (!url) return '';
    return transformImageUrl(url, {
      size: 'large',
      quality: 90
    });
  }, [product?.images, currentImageIndex]);

  const thumbnailUrls = useMemo(() => {
    if (!product?.images) return [];
    return product.images.map(image => 
      transformImageUrl(image.url, {
        size: 'thumbnail',
        quality: 80
      })
    );
  }, [product?.images]);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;

        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', id)
          .order('order');

        if (imagesError) throw imagesError;

        if (productData && imagesData) {
          setProduct({
            ...productData,
            images: imagesData
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? (product?.images.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === (product?.images.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images[0]?.url || ''
    });
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-burgundy-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-burgundy-900">
            Produkt nicht gefunden
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square">
            <img
              src={mainImageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
            
            {product.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-burgundy-700 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-burgundy-700 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    currentImageIndex === index
                      ? 'border-burgundy-600'
                      : 'border-transparent hover:border-burgundy-300'
                  }`}
                >
                  <img
                    src={thumbnailUrls[index]}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-typewriter text-burgundy-900 mb-4">
            {product.name}
          </h1>
          
          <p className="text-2xl font-medium text-burgundy-700 mb-6">
            {(product.price / 100).toLocaleString('de-DE', {
              style: 'currency',
              currency: 'EUR'
            })}
          </p>

          <div className="prose prose-burgundy mb-8">
            <p className="text-lg text-gray-600 whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Verfügbarkeit: {product.stock > 0 ? 'Auf Lager' : 'Ausverkauft'}
            </p>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-5 h-5" />
              In den Warenkorb
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}