import React from 'react';
import { Link } from 'react-router-dom';
import { useImageUrl } from '../utils/imageHandler';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export function ProductCard({ id, name, description, price, imageUrl }: ProductCardProps) {
  const optimizedImageUrl = useImageUrl(imageUrl, {
    size: 'medium',
    quality: 85,
    format: 'webp'
  });

  return (
    <Link to={`/shop/product/${id}`} className="group">
      <div className="relative overflow-hidden mb-6">
        <img 
          src={optimizedImageUrl} 
          alt={name}
          className="w-full h-80 object-cover transform group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
      </div>
      <h4 className="text-2xl mb-3 text-burgundy-800 font-typewriter tracking-wide">{name}</h4>
      <p className="text-stone-600 italic mb-4">{description}</p>
      <p className="text-burgundy-700 font-bold">{(price / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
    </Link>
  );
}