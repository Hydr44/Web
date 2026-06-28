/**
 * Documenti legali (Privacy / Cookie / Termini / DPA) — versione e accettazione.
 *
 * La versione CORRENTE vive in `system_settings.legal_policy` (modificabile dal
 * pannello admin senza deploy). Questi valori sono solo il DEFAULT di fallback
 * se la riga non esiste ancora.
 *
 * Tutte le policy condividono un'unica "versione legale": quando se ne aggiorna
 * una si incrementa la versione, e gli utenti che avevano accettato una
 * versione precedente rivedono il consenso al prossimo accesso.
 */
export const DEFAULT_LEGAL_VERSION = "3.0";
export const DEFAULT_LEGAL_EFFECTIVE = "2026-02-23";

export const LEGAL_DOCS: { key: string; title: string; href: string }[] = [
  { key: "privacy", title: "Informativa Privacy", href: "/privacy-policy" },
  { key: "cookie", title: "Cookie Policy", href: "/cookie-policy" },
  { key: "terms", title: "Termini di Servizio", href: "/terms-of-use" },
  { key: "dpa", title: "Trattamento Dati (DPA)", href: "/dpa" },
];

/** Confronto "x.y.z" → -1 / 0 / 1 */
export function cmpVersion(a: string, b: string): number {
  const pa = String(a).split(".").map((n) => Number(n) || 0);
  const pb = String(b).split(".").map((n) => Number(n) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/** true se l'utente non ha accettato, o ha accettato una versione precedente a quella corrente. */
export function isConsentStale(accepted: string | null | undefined, current: string): boolean {
  if (!accepted) return true;
  return cmpVersion(accepted, current) < 0;
}
