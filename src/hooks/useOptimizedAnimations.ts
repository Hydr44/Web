import { useReducedMotion } from "./useReducedMotion";

export const useOptimizedAnimations = () => {
  const prefersReducedMotion = useReducedMotion();

  // Animazioni ottimizzate per performance
  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3, ease: "easeOut" }
  };

  const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  const slideIn = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  };

  // Se l'utente preferisce ridotte animazioni, usa versioni semplici
  if (prefersReducedMotion) {
    return {
      fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } },
      slideUp: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } },
      slideIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } },
      scaleIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } },
      staggerContainer: { animate: { transition: { staggerChildren: 0.05 } } },
      staggerItem: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } }
    };
  }

  return {
    fadeIn,
    slideUp,
    slideIn,
    scaleIn,
    staggerContainer,
    staggerItem
  };
};
