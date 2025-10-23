"use client";

import { useEffect, useState } from "react";

/**
 * Hook per rilevare se l'utente preferisce animazioni ridotte
 * Utile per dispositivi lenti o utenti con preferenze di accessibilità
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook per rilevare se il dispositivo è lento
 * Basato su navigator.hardwareConcurrency e navigator.deviceMemory
 */
export function useSlowDevice() {
  const [isSlowDevice, setIsSlowDevice] = useState(false);

  useEffect(() => {
    // Rileva dispositivi con poche risorse
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const connection = (navigator as any).connection;
    
    const slowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.saveData === true
    );

    setIsSlowDevice(
      cores < 4 || 
      memory < 4 || 
      slowConnection ||
      window.innerWidth < 768 // Dispositivi mobili
    );
  }, []);

  return isSlowDevice;
}
