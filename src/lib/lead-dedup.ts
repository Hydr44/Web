// Guardia anti-duplicati per la CREAZIONE dei lead (CRM Commerciale — Fase 0).
// Spec: docs/specs/crm-commerciale-provvigione.md §3.2
//
// Decisione: i 2 duplicati legacy restano; qui si impedisce solo la nascita di
// NUOVI duplicati. Nessun vincolo UNIQUE hard sul DB (fallirebbe coi legacy):
// la protezione è applicativa, sui punti di ingresso di un nuovo lead.
//
// `db` è un qualsiasi client Supabase (service-role o server): si usa solo
// `.from('leads').select(...)`.

import type { SupabaseClient } from '@supabase/supabase-js';

type DbClient = Pick<SupabaseClient, 'from'>;

export interface LeadMatch {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  status: string | null;
}

export interface DedupResult {
  /** Match forte: stessa email normalizzata → BLOCCARE la creazione manuale. */
  exact: LeadMatch | null;
  /** Match debole: stessa P.IVA o telefono → solo AVVISO, non bloccare. */
  soft: LeadMatch | null;
}

const COLS = 'id,name,email,company,status';

/** Email normalizzata: lowercase + trim (null se vuota). */
export function normalizeEmail(email?: string | null): string | null {
  const e = (email || '').toLowerCase().trim();
  return e || null;
}

/** P.IVA normalizzata: maiuscolo, senza spazi (null se vuota). */
function normalizeVat(vat?: string | null): string | null {
  const v = (vat || '').toUpperCase().replace(/\s/g, '').trim();
  return v || null;
}

/** Escapa i wildcard ILIKE (%, _) e il backslash → match letterale sicuro. */
function likeEscape(s: string): string {
  return s.replace(/([\\%_])/g, String.raw`\$1`);
}

/** Esegue una query lead e ritorna il primo match (o null). */
async function pick(q: PromiseLike<{ data: unknown[] | null }>): Promise<LeadMatch | null> {
  const { data } = await q;
  return data?.length ? (data[0] as LeadMatch) : null;
}

/**
 * Cerca un lead potenzialmente duplicato a partire da email/telefono/P.IVA.
 * Ritorna { exact, soft }: `exact` (email) va trattato come blocco, `soft`
 * (P.IVA/telefono) come semplice avviso.
 */
export async function findDuplicateLead(
  db: DbClient,
  fields: { email?: string | null; phone?: string | null; vat_number?: string | null },
  opts: { excludeId?: string } = {}
): Promise<DedupResult> {
  const email = normalizeEmail(fields.email);
  const vat = normalizeVat(fields.vat_number);
  const phone = (fields.phone || '').trim() || null;
  const exclude = opts.excludeId;

  // 1) Match forte: stessa email (case-insensitive, wildcard escaped).
  let exact: LeadMatch | null = null;
  if (email) {
    let q = db.from('leads').select(COLS).not('email', 'is', null).ilike('email', likeEscape(email));
    if (exclude) q = q.neq('id', exclude);
    exact = await pick(q.limit(1));
  }

  // 2) Match debole (solo se non c'è già un exact): P.IVA, poi telefono esatto.
  let soft: LeadMatch | null = null;
  if (!exact && vat) {
    let q = db.from('leads').select(COLS).ilike('vat_number', likeEscape(vat));
    if (exclude) q = q.neq('id', exclude);
    soft = await pick(q.limit(1));
  }
  if (!exact && !soft && phone) {
    let q = db.from('leads').select(COLS).eq('phone', phone);
    if (exclude) q = q.neq('id', exclude);
    soft = await pick(q.limit(1));
  }

  return { exact, soft };
}
