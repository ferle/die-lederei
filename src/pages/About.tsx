import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { transformImageUrl } from '../utils/imageHandler';

interface Settings {
  about_text: string;
}

interface AboutImage {
  id: string;
  url: string;
  order: number;
}

export function About() {
  const [settings, setSettings] = useState<Settings>({ about_text: '' });
  const [images, setImages] = useState<AboutImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settingsResponse, imagesResponse] = await Promise.all([
          supabase
            .from('settings')
            .select('about_text')
            .single(),
          supabase
            .from('about_images')
            .select('*')
            .order('order')
            .limit(3)
        ]);
        
        if (settingsResponse.data) {
          setSettings(settingsResponse.data);
        }

        if (imagesResponse.data) {
          setImages(imagesResponse.data);
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
      <section className="relative py-24 bg-burgundy-50">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
        <div className="relative max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-5xl font-typewriter text-burgundy-900 mb-6">Über mich</h1>
          <p className="text-lg text-burgundy-800/80 italic">
            Traditionelles Handwerk trifft auf modernes Design
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="prose prose-lg prose-burgundy mx-auto">
            {settings.about_text.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed mb-8">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Images Section */}
      {images.length > 0 && (
        <section className="py-16 bg-burgundy-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {images.map((image) => (
                <div key={image.id} className="aspect-square">
                  <img 
                    src={transformImageUrl(image.url, {
                      size: 'medium',
                      quality: 85,
                      format: 'webp'
                    })}
                    alt="Werkstattimpression"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}