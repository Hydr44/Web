import { Variants } from "framer-motion";

/**
 * Varianti di animazione ottimizzate per iOS e dispositivi mobili
 * Usa transform e opacity invece di proprietà che causano reflow
 */
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    // Usa will-change per ottimizzare il rendering
    willChange: "transform, opacity"
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuart per iOS
    }
  }
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
    willChange: "transform, opacity"
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 20,
    willChange: "transform, opacity"
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    willChange: "transform, opacity"
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
};

/**
 * Varianti ridotte per dispositivi lenti o utenti con preferenze di accessibilità
 */
export const reducedMotion: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

/**
 * Hook per ottenere le varianti appropriate basate sulle preferenze
 */
export function useAnimationVariants() {
  const isReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Su mobile o con motion ridotta, usa animazioni semplici
  if (isReducedMotion || isMobile) {
    return {
      fadeInUp: reducedMotion,
      fadeInLeft: reducedMotion,
      fadeInRight: reducedMotion,
      scaleIn: reducedMotion,
    };
  }
  
  return {
    fadeInUp,
    fadeInLeft,
    fadeInRight,
    scaleIn,
  };
}
