// src/lib/console-filter.ts
"use client";

/**
 * Filtra errori non critici dalla console per utenti finali
 * Mantiene gli errori reali ma nasconde quelli "normali" come Auth session missing
 */
export function initConsoleFilter() {
  if (typeof window === "undefined") return;

  const originalError = console.error;
  const originalWarn = console.warn;

  // Lista di pattern da filtrare (errori normali che non servono agli utenti)
  const errorFilters = [
    "Auth session missing",
    "AuthSessionMissingError",
    "Auth init error",
  ];

  console.error = (...args: unknown[]) => {
    const message = args.join(" ");
    
    // Se è un errore filtrato, non mostrarlo
    if (errorFilters.some(filter => message.includes(filter))) {
      return;
    }
    
    // Altrimenti mostra normalmente
    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(" ");
    
    // Filtra anche alcuni warning
    if (message.includes("Auth session missing")) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
}
