import { useReducedMotion } from "./useReducedMotion";
import type { HTMLMotionProps } from "framer-motion";

/**
 * Hook che ritorna preset di animazioni framer-motion ottimizzati per perf.
 * Le easing sono `as const` per evitare type-widening a `string`, che
 * framer-motion non accetta nei MotionProps.
 *
 * Le tipizzazioni `as MotionPreset` permettono di fare `{...preset}` sui
 * `motion.*` senza errori TS.
 */
type MotionPreset = Pick<HTMLMotionProps<"div">, "initial" | "animate" | "transition">;

export const useOptimizedAnimations = () => {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn: MotionPreset = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  };

  const slideUp: MotionPreset = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" as const },
  };

  const slideIn: MotionPreset = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  };

  const scaleIn: MotionPreset = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  };

  const staggerContainer: MotionPreset = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    } as MotionPreset["animate"],
  };

  const staggerItem: MotionPreset = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  };

  if (prefersReducedMotion) {
    return {
      fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } } as MotionPreset,
      slideUp: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } } as MotionPreset,
      slideIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } } as MotionPreset,
      scaleIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } } as MotionPreset,
      staggerContainer: { animate: { transition: { staggerChildren: 0.05 } } } as MotionPreset,
      staggerItem: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } } as MotionPreset,
    };
  }

  return { fadeIn, slideUp, slideIn, scaleIn, staggerContainer, staggerItem };
};
