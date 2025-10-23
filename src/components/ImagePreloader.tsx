"use client";

import { useEffect } from "react";

interface ImagePreloaderProps {
  images: string[];
  preloadOnMount?: boolean;
  preloadOnHover?: boolean;
}

export default function ImagePreloader({ 
  images, 
  preloadOnMount = false,
  preloadOnHover = true 
}: ImagePreloaderProps) {
  useEffect(() => {
    if (!preloadOnMount) return;

    // Precarica immagini solo quando necessario
    const preloadImages = () => {
      images.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    // Precarica dopo un delay per non bloccare il caricamento iniziale
    const timer = setTimeout(preloadImages, 1000);
    
    return () => clearTimeout(timer);
  }, [images, preloadOnMount]);

  // Precarica su hover per migliorare l'UX
  const handleMouseEnter = () => {
    if (!preloadOnHover) return;
    
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      style={{ display: 'none' }}
      aria-hidden="true"
    />
  );
}
