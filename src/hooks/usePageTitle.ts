"use client";

import { useEffect } from "react";

/**
 * Imposta il titolo del tab del browser per le pagine client.
 *
 * Le pagine `/dashboard/*` sono client-component, quindi non possono
 * esportare `metadata` (richiede server component). In assenza di un
 * layout server per il gruppo, useremmo il fallback dell'app
 * (`RescueManager`) ovunque. Questo hook dà a ciascuna pagina un titolo
 * specifico solo per il tab — niente SEO/OG necessario perché le route
 * sono private.
 *
 * Uso:
 *   usePageTitle("Sicurezza");
 *   // → "Sicurezza — RescueManager"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} — RescueManager`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
