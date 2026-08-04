/**
 * Piani abbonamento — etichette e "profilo per caso d'uso" per il PORTALE cliente.
 *
 * I piani nel DB (`org_subscriptions.plan`) sono TIER per NUMERO di moduli:
 *   starter / professional / business / full  ("Base completo + N moduli a scelta").
 * Il nome che il cliente riconosce (Soccorso e trasporti / Autodemolitore / Completo)
 * è un CASO D'USO = combinazione di moduli attivi, non lo slug del piano.
 * Per questo `planProfileName` deriva il nome dai MODULI, non dal solo tier.
 */

/** Etichetta del tier (slug → nome leggibile). Qui gli alias voluti (es. full→Completo). */
export const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  full: "Completo",
  custom: "Su misura",
  free: "Free",
  trial: "Prova",
};

export function planLabel(slug?: string | null): string {
  if (!slug) return "—";
  return PLAN_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Moduli "compliance" (add-on oltre al Base sempre incluso). */
const COMPLIANCE = ["rvfu", "rentri", "sdi", "fatturazione", "contabilita", "unrae"];

/**
 * Nome "profilo" mostrato al cliente, derivato dai moduli attivi:
 *  - Completo            → piano `full` oppure (quasi) tutti gli add-on
 *  - Autodemolitore      → ha RVFU + RENTRI
 *  - Soccorso e trasporti→ solo Base (nessun add-on compliance)
 *  - altrimenti          → etichetta del tier
 */
export function planProfileName(plan?: string | null, modules: string[] = []): string {
  const m = new Set((modules || []).map((x) => String(x).toLowerCase()));
  const addons = COMPLIANCE.filter((x) => m.has(x));
  if (plan === "full" || addons.length >= 4) return "Completo";
  if (m.has("rvfu") && m.has("rentri")) return "Autodemolitore";
  if (addons.length === 0) return "Soccorso e trasporti";
  return planLabel(plan);
}

/** Etichette moduli leggibili (per il sottotitolo "cosa include"). */
export const MODULE_LABELS: Record<string, string> = {
  base: "Gestionale",
  trasporti: "Soccorso & trasporti",
  rvfu: "Demolizioni (RVFU)",
  rentri: "RENTRI",
  sdi: "Fatturazione (SDI)",
  fatturazione: "Fatturazione (SDI)",
  contabilita: "Contabilità",
  unrae: "UNRAE",
};
export function moduleLabel(key: string): string {
  return MODULE_LABELS[String(key).toLowerCase()] || key;
}

/** I moduli compliance attivi, come etichette (esclude 'base'), per un sottotitolo. */
export function complianceModuleLabels(modules: string[] = []): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of modules || []) {
    const key = String(k).toLowerCase();
    if (key === "base" || key === "trasporti") continue;
    const lbl = moduleLabel(key);
    if (!seen.has(lbl)) { seen.add(lbl); out.push(lbl); }
  }
  return out;
}

/** Prezzo mensile listino (euro) per tier — per un "importo" indicativo in dashboard. */
export const PLAN_MONTHLY_EUR: Record<string, number> = {
  starter: 179,
  professional: 279,
  business: 359,
  full: 449,
};

/** Importo mensile: custom_price se sub personalizzata, altrimenti listino del tier. */
export function planMonthlyEur(
  plan?: string | null,
  isCustom?: boolean,
  customPrice?: number | null,
): number | null {
  if (isCustom && customPrice != null) return Number(customPrice);
  if (plan && PLAN_MONTHLY_EUR[plan] != null) return PLAN_MONTHLY_EUR[plan];
  return null;
}
