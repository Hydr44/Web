// src/components/ConsoleFilter.tsx
"use client";

import { useEffect } from "react";

/**
 * Componente che filtra errori non critici dalla console
 * Nasconde errori "normali" come Auth session missing per utenti non loggati
 */
export default function ConsoleFilter() {
  useEffect(() => {
    // Solo in produzione
    if (process.env.NODE_ENV !== "production") return;

    const originalError = console.error;

    // Pattern di errori da filtrare
    const errorFilters = [
      "Auth session missing",
      "AuthSessionMissingError",
      "Auth init error",
    ];

    console.error = (...args: unknown[]) => {
      const message = String(args[0] || "");
      
      // Se è un errore filtrato, non mostrarlo
      if (errorFilters.some(filter => message.includes(filter))) {
        return;
      }
      
      // Altrimenti mostra normalmente
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
