/**
 * Fatturazione clienti (SaaS) — helper admin.
 * RescueManager SRL (org emittente) fattura le org clienti per l'abbonamento.
 * Riusa la tabella `invoices` (+ `invoice_items`) e la serie DEDICATA `RM/YYYY/NNN`
 * per non mischiarsi con le fatture operative dell'org (numerate `NN/YYYY`).
 * Ref: docs/specs/admin-fatturazione-clienti.md
 */
import { supabaseAdmin } from './supabase-admin';

// Org emittente = "RescueManager S.R.L.". Override via env se cambia.
export const EMITTER_ORG_ID = process.env.RESCUEMANAGER_ORG_ID || '1ea3be12-a439-46ac-94d9-eaff1bb346c2';
export const SAAS_PREFIX = 'RM';
// Ambiente SDI per queste fatture (colonna invoices.provider_id, NOT NULL).
// Le bozze non vengono inviate: si passa a 'sdi_prod' quando si attiva l'invio reale.
export const SDI_PROVIDER = process.env.SAAS_SDI_PROVIDER || 'sdi_test';

export interface InvoiceItemInput {
  description: string;
  qty: number;
  price: number;     // prezzo unitario netto (imponibile)
  vat_perc: number;  // aliquota IVA %
}

export const AF_PREFIX = 'AF';                       // serie autofatture
export const AUTOFATTURA_TIPI = ['TD16', 'TD17', 'TD18'] as const; // reverse charge interno / servizi estero / beni intra-UE

async function nextNumber(prefix: string, year: number): Promise<string> {
  const { data } = await supabaseAdmin
    .from('invoices')
    .select('number')
    .eq('org_id', EMITTER_ORG_ID)
    .like('number', `${prefix}/${year}/%`);
  let max = 0;
  for (const r of data || []) {
    const m = /\/(\d+)\s*$/.exec(r.number || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}/${year}/${String(max + 1).padStart(4, '0')}`;
}

/** Prossimo numero serie SaaS `RM/YYYY/NNNN`. */
export function nextSaasInvoiceNumber(year: number): Promise<string> { return nextNumber(SAAS_PREFIX, year); }
/** Prossimo numero serie autofatture `AF/YYYY/NNNN`. */
export function nextAutofatturaNumber(year: number): Promise<string> { return nextNumber(AF_PREFIX, year); }

/** Dati fiscali di un fornitore (per le autofatture) dal registro suppliers. */
export async function loadSupplierFiscal(supplierId: string): Promise<{
  name: string; vat: string | null; tax_code: string | null; pec: string | null;
  codice_destinatario: string | null; address: any; regime_fiscale: string | null; paese: string | null;
} | null> {
  const { data } = await supabaseAdmin.from('suppliers').select('*').eq('id', supplierId).maybeSingle();
  if (!data) return null;
  return {
    name: data.denominazione, vat: data.vat, tax_code: data.tax_code, pec: data.pec,
    codice_destinatario: data.codice_destinatario, address: data.address,
    regime_fiscale: data.regime_fiscale, paese: data.paese,
  };
}

/** Totali di una fattura dai suoi item (imponibile, IVA, totale lordo). */
export function computeTotals(items: InvoiceItemInput[]): { imponibile: number; iva: number; totale: number } {
  let imponibile = 0;
  let iva = 0;
  for (const it of items) {
    const net = (Number(it.qty) || 0) * (Number(it.price) || 0);
    imponibile += net;
    iva += net * ((Number(it.vat_perc) || 0) / 100);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { imponibile: round(imponibile), iva: round(iva), totale: round(imponibile + iva) };
}

/** Dati fiscali del cliente (destinatario) da org_settings.company. */
export async function loadCustomerFiscal(orgId: string): Promise<{
  name: string; vat: string | null; tax_code: string | null; pec: string | null;
  codice_destinatario: string | null; address: any; regime_fiscale: string | null;
} | null> {
  const { data: org } = await supabaseAdmin.from('orgs').select('id, name').eq('id', orgId).maybeSingle();
  if (!org) return null;
  const { data: rows } = await supabaseAdmin.from('org_settings').select('key, value').eq('org_id', orgId);
  const map: Record<string, any> = {};
  for (const r of rows || []) map[r.key] = r.value;
  const company = map.company || {};
  const sdi = map.sdi || {};
  return {
    name: company.company_name || org.name,
    vat: company.vat || null,
    tax_code: company.tax_code || null,
    pec: sdi.pec || company.pec || null,
    codice_destinatario: sdi.codice_destinatario || company.codice_destinatario || null,
    address: company.address || null,
    regime_fiscale: sdi.regime_fiscale || company.regime_fiscale || null,
  };
}
