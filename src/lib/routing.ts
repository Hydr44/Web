/**
 * routing — un solo posto da cui passa il calcolo dei percorsi su strada.
 *
 * Registro difetti M8: l'indirizzo era scritto a mano in cinque punti su tre
 * applicazioni, e puntava sempre a `router.project-osrm.org` — il server
 * DIMOSTRATIVO pubblico del progetto OSRM. Nessuna garanzia di disponibilità,
 * nessun contratto, uso continuativo in produzione che il progetto scoraggia.
 *
 * Cambiare fornitore ora è una variabile, non un rilascio di tre applicazioni:
 *   NEXT_PUBLIC_OSRM_BASE=https://osrm.rescuemanager.eu
 *
 * ⚠️ Cambiando indirizzo va aggiornata anche la `connect-src` in next.config.ts,
 *    altrimenti il browser blocca la chiamata per policy di sicurezza.
 *
 * Gemello di desktop-app/.../src/lib/routing.js e RescueMobile/src/lib/routing.ts.
 */

const PREDEFINITO = 'https://router.project-osrm.org';
const ATTESA_MASSIMA_MS = 8000;

export function osrmBase(): string {
  const b = process.env.NEXT_PUBLIC_OSRM_BASE;
  return (b || PREDEFINITO).replace(/\/$/, '');
}

export function usaServerDimostrativo(): boolean {
  return osrmBase() === PREDEFINITO;
}

/**
 * Percorso su strada fra due punti [lat, lng].
 * Torna null quando il servizio non risponde: chi chiama disegna la retta.
 */
export async function calcolaPercorso(
  punti: [number, number][],
): Promise<{ coords: [number, number][]; km: number | null; minuti: number | null } | null> {
  if (!Array.isArray(punti) || punti.length < 2) return null;
  const coordStr = punti.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `${osrmBase()}/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), ATTESA_MASSIMA_MS);
  try {
    const res = await fetch(url, { signal: stop.signal });
    if (!res.ok) return null;
    const dati = await res.json();
    const r = dati?.code === 'Ok' ? dati.routes?.[0] : null;
    if (!r) return null;
    return {
      coords: (r.geometry?.coordinates || []).map(([lng, lat]: [number, number]) => [lat, lng]),
      km: typeof r.distance === 'number' ? r.distance / 1000 : null,
      minuti: typeof r.duration === 'number' ? r.duration / 60 : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
