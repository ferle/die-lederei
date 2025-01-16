import { useEffect, useState } from 'react';

export function useImagePreloader(imageUrls: string[]) {
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const preloadImages = async () => {
      const imagePromises = imageUrls.map(url => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = resolve;
          img.onerror = resolve; // Resolve on error too, don't reject
        });
      });

      try {
        await Promise.all(imagePromises);
        if (isMounted) {
          setImagesPreloaded(true);
        }
      } catch (error) {
        // Don't log the error, just set preloaded to true to not block rendering
        if (isMounted) {
          setImagesPreloaded(true);
        }
      }
    };

    if (imageUrls.length > 0) {
      setImagesPreloaded(false);
      preloadImages();
    } else {
      setImagesPreloaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, [imageUrls]);

  return imagesPreloaded;
}