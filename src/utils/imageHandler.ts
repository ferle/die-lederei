import { useMemo } from 'react';

type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

interface ImageOptions {
  size?: ImageSize;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg';
}

const SIZES = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1200,
  original: 0
};

/**
 * Transforms an image URL to use Imgix-style parameters for optimization
 */
export function transformImageUrl(url: string, options: ImageOptions = {}): string {
  if (!url) return '';
  
  // Only transform Unsplash URLs
  if (!url.includes('unsplash.com')) return url;

  const { size = 'original', quality = 80, format = 'auto' } = options;
  
  // Start with the original URL
  const baseUrl = url.split('?')[0];
  const params = new URLSearchParams();

  // Add size parameter if not original
  if (size !== 'original') {
    params.append('w', SIZES[size].toString());
    params.append('fit', 'crop');
  }

  // Add quality parameter
  params.append('q', quality.toString());

  // Add format parameter
  if (format !== 'auto') {
    params.append('fm', format);
  }

  // Return transformed URL
  return `${baseUrl}?${params.toString()}`;
}

/**
 * React hook for transforming image URLs with memoization
 */
export function useImageUrl(url: string, options: ImageOptions = {}) {
  return useMemo(() => transformImageUrl(url, options), [url, JSON.stringify(options)]);
}