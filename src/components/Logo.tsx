import React from 'react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LogoProps {
  className?: string;
  size?: 'default' | 'large';
}

export function Logo({ className = '', size = 'default' }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const { data } = await supabase
        .from('settings')
        .select('logo_url')
        .single();
      
      if (data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
    };

    fetchLogo();
  }, []);

  const sizeClasses = {
    default: 'h-16 w-auto',
    large: 'h-32 w-auto'
  };

  return (
    <Link 
      to="/" 
      className={`block relative z-50 bg-white rounded-full p-6 shadow-lg transform transition-transform hover:scale-105 ${className}`}
    >
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt="Johanna - Die Lederei" 
          className={sizeClasses[size]}
        />
      ) : (
        <span className={`font-typewriter tracking-wider text-burgundy-800 ${
          size === 'large' ? 'text-5xl' : 'text-4xl'
        }`}>
          Johanna
        </span>
      )}
    </Link>
  );
}