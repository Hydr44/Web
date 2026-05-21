"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ReactNode } from "react";

/**
 * Wrapper di transizione fra pagine del dashboard.
 *
 * Usa AnimatePresence mode="wait" così la pagina uscente termina la sua
 * animazione PRIMA che entri la nuova → niente più sensazione di "scatto"
 * brusco quando si naviga.
 *
 * Animazione volutamente *minimale* (150ms fade + 4px translateY): impercettibile
 * ma sufficiente a smorzare il cambio. Rispetta `prefers-reduced-motion`.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  // Reduced-motion: niente animazione, solo render diretto.
  if (reduced) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
