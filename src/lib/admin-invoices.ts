/**
 * Fatturazione clienti (SaaS) — helper admin.
 * RescueManager SRL (org emittente) fattura le org clienti per l'abbonamento.
 * Riusa la tabella `invoices` (+ `invoice_items`) e la serie DEDICATA `RM/YYYY/NNN`
 * per non mischiarsi con le fatture operative dell'org (numerate `NN/YYYY`).
 * Ref: docs/specs/admin-fatturazione-clienti.md
 */
import { supabaseAdmin } from './supabase-admin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Org emittente = "RescueManager S.R.L.". Override via env se cambia.
export const EMITTER_ORG_ID = process.env.RESCUEMANAGER_ORG_ID || '1ea3be12-a439-46ac-94d9-eaff1bb346c2';
export const SAAS_PREFIX = 'RM';
// Ambiente SDI per queste fatture (colonna invoices.provider_id, NOT NULL).
// Le bozze non vengono inviate: si passa a 'sdi_prod' quando si attiva l'invio reale.
export const SDI_PROVIDER = process.env.SAAS_SDI_PROVIDER || 'sdi_test';

export const AF_PREFIX = 'AF';                       // serie autofatture
export const AUTOFATTURA_TIPI = ['TD16', 'TD17', 'TD18'] as const; // reverse charge interno / servizi estero / beni intra-UE

export interface InvoiceItemInput {
  description: string;
  qty: number;
  price: number;              // prezzo unitario netto (imponibile)
  vat_perc: number;           // aliquota IVA %
  vat_nature?: string | null; // natura IVA (N1..N7) — obbligatoria quando aliquota = 0
  discount_perc?: number | null; // sconto % di riga
}

// ── Natura IVA (FatturaPA §2.2.2.2) — richiesta per le righe con aliquota 0 ──
export const NATURA_OPTIONS: { value: string; label: string }[] = [
  { value: 'N1',   label: 'N1 — Escluse ex art. 15' },
  { value: 'N2.1', label: 'N2.1 — Non soggette (artt. 7-7 septies)' },
  { value: 'N2.2', label: 'N2.2 — Non soggette (altri casi)' },
  { value: 'N3.1', label: 'N3.1 — Non imponibili (esportazioni)' },
  { value: 'N3.2', label: 'N3.2 — Non imponibili (cessioni intra-UE)' },
  { value: 'N3.3', label: 'N3.3 — Non imponibili (verso San Marino)' },
  { value: 'N3.4', label: 'N3.4 — Non imponibili (operazioni assimilate)' },
  { value: 'N3.5', label: 'N3.5 — Non imponibili (dichiarazioni d’intento)' },
  { value: 'N3.6', label: 'N3.6 — Non imponibili (altre)' },
  { value: 'N4',   label: 'N4 — Esenti' },
  { value: 'N5',   label: 'N5 — Regime del margine / IVA non esposta' },
  { value: 'N6.1', label: 'N6.1 — Reverse charge (rottami)' },
  { value: 'N6.2', label: 'N6.2 — Reverse charge (oro e argento)' },
  { value: 'N6.3', label: 'N6.3 — Reverse charge (subappalto edilizia)' },
  { value: 'N6.4', label: 'N6.4 — Reverse charge (cessione fabbricati)' },
  { value: 'N6.5', label: 'N6.5 — Reverse charge (telefoni cellulari)' },
  { value: 'N6.6', label: 'N6.6 — Reverse charge (prodotti elettronici)' },
  { value: 'N6.7', label: 'N6.7 — Reverse charge (edilizia e settori connessi)' },
  { value: 'N6.8', label: 'N6.8 — Reverse charge (settore energetico)' },
  { value: 'N6.9', label: 'N6.9 — Reverse charge (altri casi)' },
  { value: 'N7',   label: 'N7 — IVA assolta in altro Stato UE' },
];

// Natura di default suggerita per tipo autofattura (reverse charge).
export const AUTOFATTURA_NATURA_DEFAULT: Record<string, string> = {
  TD16: 'N6.9', // reverse charge interno
  TD17: 'N2.2', // servizi da soggetto estero → non soggette
  TD18: 'N3.2', // acquisto beni intra-UE → non imponibili
};

// ── Modalità di pagamento (FatturaPA §2.4.2.2 ModalitaPagamento) ──
export const PAYMENT_MODES: { value: string; label: string }[] = [
  { value: 'MP05', label: 'Bonifico bancario' },
  { value: 'MP08', label: 'Carta di pagamento' },
  { value: 'MP19', label: 'SEPA Direct Debit' },
  { value: 'MP01', label: 'Contanti' },
  { value: 'MP23', label: 'PagoPA' },
];

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

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface RiepilogoIva {
  aliquota: number;      // % IVA
  natura: string | null; // valorizzata solo quando aliquota = 0
  imponibile: number;    // base
  imposta: number;       // IVA
}

export interface InvoiceTotals {
  imponibile: number;   // somma netti riga (dopo sconto riga)
  imposta: number;      // IVA totale
  iva: number;          // alias di imposta (retro-compat)
  bollo: number;        // marca da bollo virtuale (2€ se esente/non imp. > 77,47)
  totale: number;       // totale documento
  netto: number;        // netto a pagare (= totale, meno eventuale ritenuta futura)
  riepilogo: RiepilogoIva[];
}

/**
 * Totali di una fattura dai suoi item: imponibile (con sconto riga), riepilogo IVA
 * per aliquota+natura, imposta, bollo virtuale, totale documento.
 */
export function computeTotals(items: InvoiceItemInput[]): InvoiceTotals {
  const groups = new Map<string, RiepilogoIva>();
  let imponibile = 0;
  let imposta = 0;
  let esenteBase = 0;

  for (const it of items) {
    const qty = Number(it.qty) || 0;
    const price = Number(it.price) || 0;
    const disc = Math.min(Math.max(Number(it.discount_perc) || 0, 0), 100);
    const aliquota = Number(it.vat_perc) || 0;
    const natura = aliquota === 0 ? (it.vat_nature || null) : null;
    const net = round2(qty * price * (1 - disc / 100));
    const rowIva = round2(net * (aliquota / 100));

    imponibile += net;
    imposta += rowIva;
    if (aliquota === 0) esenteBase += net;

    const key = `${aliquota}|${natura || ''}`;
    const g = groups.get(key) || { aliquota, natura, imponibile: 0, imposta: 0 };
    g.imponibile = round2(g.imponibile + net);
    g.imposta = round2(g.imposta + rowIva);
    groups.set(key, g);
  }

  imponibile = round2(imponibile);
  imposta = round2(imposta);
  // Bollo virtuale €2 su operazioni esenti/non imponibili oltre 77,47 €.
  const bollo = esenteBase > 77.47 ? 2 : 0;
  const totale = round2(imponibile + imposta + bollo);

  const riepilogo = Array.from(groups.values()).sort((a, b) => b.aliquota - a.aliquota);
  return { imponibile, imposta, iva: imposta, bollo, totale, netto: totale, riepilogo };
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

// ── Classificazione documento dalla riga invoices ──
export type InvoiceKind = 'fattura' | 'autofattura' | 'passiva';
export function classifyInvoice(row: { number?: string | null; direction?: string | null }): InvoiceKind {
  const num = row.number || '';
  if (num.startsWith(`${AF_PREFIX}/`)) return 'autofattura';
  if (num.startsWith(`${SAAS_PREFIX}/`)) return 'fattura';
  return row.direction === 'passive' ? 'passiva' : 'fattura';
}

export type InvoiceScope = 'attive' | 'autofatture' | 'passive' | 'all';

/**
 * Elenco fatture dell'org emittente per ambito:
 *  - attive:     serie RM/ (fatture ai clienti)
 *  - autofatture: serie AF/ (reverse charge)
 *  - passive:    ricevute dai fornitori (direction=passive, non AF/)
 *  - all:        tutte e tre
 */
export async function listInvoices(scope: InvoiceScope) {
  let q = supabaseAdmin
    .from('invoices')
    .select('id, number, date, total, currency, sdi_status, payment_status, customer_name, customer_vat, direction, meta, created_at')
    .eq('org_id', EMITTER_ORG_ID)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (scope === 'attive') q = q.like('number', `${SAAS_PREFIX}/%`);
  else if (scope === 'autofatture') q = q.like('number', `${AF_PREFIX}/%`);
  else if (scope === 'passive') q = q.eq('direction', 'passive').not('number', 'like', `${AF_PREFIX}/%`);
  else q = q.or(`number.like.${SAAS_PREFIX}/%,number.like.${AF_PREFIX}/%,direction.eq.passive`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data || []).map((r) => {
    const kind = classifyInvoice(r);
    return {
      id: r.id,
      number: r.number,
      date: r.date,
      total: Number(r.total) || 0,
      currency: r.currency || 'EUR',
      sdi_status: r.sdi_status || 'draft',
      payment_status: r.payment_status || 'unpaid',
      customer_name: r.customer_name,
      customer_vat: r.customer_vat,
      billed_org_id: (r.meta as any)?.saas?.billed_org_id || null,
      plan: (r.meta as any)?.saas?.plan || null,
      kind,
      tipo_documento: (r.meta as any)?.sdi?.documento?.tipo_documento || (kind === 'passiva' ? 'TD01' : null),
      created_at: r.created_at,
    };
  });
}

/** Dettaglio completo (testata + righe + totali ricalcolati + controparte). */
export async function loadInvoiceDetail(id: string) {
  const { data: inv } = await supabaseAdmin.from('invoices').select('*').eq('id', id).maybeSingle();
  if (!inv) return null;
  const { data: items } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('id', { ascending: true });

  const mapped: InvoiceItemInput[] = (items || []).map((it) => ({
    description: it.item_description || it.item_code || '',
    qty: Number(it.qty) || 0,
    price: Number(it.price) || 0,
    vat_perc: Number(it.vat_perc) || 0,
    vat_nature: it.vat_nature || null,
    discount_perc: it.discount_type === 'percent' ? Number(it.discount_value) || 0 : 0,
  }));
  const totals = computeTotals(mapped);
  const meta = (inv.meta as any) || {};
  return {
    invoice: inv,
    items: (items || []).map((it) => ({
      description: it.item_description || it.item_code || '',
      qty: Number(it.qty) || 0,
      price: Number(it.price) || 0,
      vat_perc: Number(it.vat_perc) || 0,
      vat_nature: it.vat_nature || null,
      discount_perc: it.discount_type === 'percent' ? Number(it.discount_value) || 0 : 0,
    })),
    totals,
    kind: classifyInvoice(inv),
    meta,
    controparte: meta?.sdi?.controparte || null,
    pagamento: meta?.pagamento || null,
  };
}

// ───────────────────────── PDF (fattura di cortesia) ─────────────────────────

// Rimpiazza i caratteri non codificabili in WinAnsi (Helvetica standard).
function safe(s: any): string {
  const str = s == null ? '' : String(s);
  return str
    .replace(/→/g, '->')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x20-\xFF€–—•]/g, '?');
}
function money(n: number): string {
  return (Number(n) || 0).toFixed(2).replace('.', ',') + ' €';
}
function fmtDate(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return safe(v);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function addrLine(a: any): string[] {
  if (!a) return [];
  const l1 = [a.street, a.civico].filter(Boolean).join(' ').trim();
  const l2 = [[a.zip, a.city].filter(Boolean).join(' ').trim(), a.province ? `(${a.province})` : ''].filter(Boolean).join(' ').trim();
  return [l1, l2, a.country].filter(Boolean).map(safe);
}

/** Genera il PDF (fattura di cortesia) di una fattura/autofattura. Ritorna i byte. */
export async function buildInvoicePdf(id: string): Promise<{ bytes: Uint8Array; filename: string } | null> {
  const detail = await loadInvoiceDetail(id);
  if (!detail) return null;
  const { invoice, items, totals, kind, meta, controparte, pagamento } = detail;
  const emitter = await loadCustomerFiscal(EMITTER_ORG_ID);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 48;
  const W = 595.28;
  const ink = rgb(0.09, 0.11, 0.15);
  const grey = rgb(0.42, 0.45, 0.5);
  const line = rgb(0.82, 0.84, 0.87);
  const band = rgb(0.95, 0.96, 0.97);
  let y = 800;

  const text = (s: string, x: number, yy: number, opts: { size?: number; b?: boolean; color?: any } = {}) => {
    page.drawText(safe(s), { x, y: yy, size: opts.size ?? 9, font: opts.b ? bold : font, color: opts.color ?? ink });
  };
  const right = (s: string, xRight: number, yy: number, opts: { size?: number; b?: boolean; color?: any } = {}) => {
    const size = opts.size ?? 9;
    const f = opts.b ? bold : font;
    const w = f.widthOfTextAtSize(safe(s), size);
    page.drawText(safe(s), { x: xRight - w, y: yy, size, font: f, color: opts.color ?? ink });
  };
  const hr = (yy: number) => page.drawLine({ start: { x: M, y: yy }, end: { x: W - M, y: yy }, thickness: 0.6, color: line });

  // ── Intestazione emittente ──
  text(emitter?.name || 'RescueManager S.R.L.', M, y, { size: 15, b: true });
  y -= 16;
  if (emitter?.vat) { text(`P.IVA ${emitter.vat}`, M, y, { size: 8, color: grey }); }
  if (emitter?.tax_code && emitter.tax_code !== emitter.vat) { text(`  C.F. ${emitter.tax_code}`, M + 90, y, { size: 8, color: grey }); }
  y -= 12;
  for (const l of addrLine(emitter?.address)) { text(l, M, y, { size: 8, color: grey }); y -= 11; }
  if (emitter?.pec) { text(`PEC ${emitter.pec}`, M, y, { size: 8, color: grey }); y -= 11; }

  // ── Titolo documento (destra) ──
  const docTitle = kind === 'autofattura' ? 'AUTOFATTURA' : (kind === 'passiva' ? 'FATTURA PASSIVA' : 'FATTURA');
  right(docTitle, W - M, 800, { size: 15, b: true });
  right(`N. ${invoice.number || '—'}`, W - M, 782, { size: 10, b: true });
  right(`Data ${fmtDate(invoice.date)}`, W - M, 768, { size: 9, color: grey });
  const tipoDoc = meta?.sdi?.documento?.tipo_documento;
  if (tipoDoc) right(`Tipo doc. ${tipoDoc}`, W - M, 755, { size: 8, color: grey });

  y = Math.min(y, 748) - 6;
  hr(y); y -= 18;

  // ── Controparte ──
  const cpLabel = kind === 'passiva' || kind === 'autofattura' ? 'Fornitore' : 'Cliente';
  text(cpLabel, M, y, { size: 8, b: true, color: grey }); y -= 13;
  text(controparte?.denominazione || invoice.customer_name || '—', M, y, { size: 11, b: true }); y -= 13;
  const cpParts: string[] = [];
  if (controparte?.partita_iva || invoice.customer_vat) cpParts.push(`P.IVA ${controparte?.partita_iva || invoice.customer_vat}`);
  if (controparte?.codice_fiscale || invoice.customer_tax_code) cpParts.push(`C.F. ${controparte?.codice_fiscale || invoice.customer_tax_code}`);
  if (cpParts.length) { text(cpParts.join('   '), M, y, { size: 8, color: grey }); y -= 11; }
  for (const l of addrLine(invoice.customer_address)) { text(l, M, y, { size: 8, color: grey }); y -= 11; }
  if (controparte?.codice_destinatario) { text(`Cod. destinatario ${controparte.codice_destinatario}`, M, y, { size: 8, color: grey }); y -= 11; }
  if (controparte?.pec) { text(`PEC ${controparte.pec}`, M, y, { size: 8, color: grey }); y -= 11; }
  y -= 6;

  // ── Tabella righe ──
  const cX = { desc: M, qty: 330, price: 385, vat: 452, tot: W - M };
  page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 16, color: band });
  text('Descrizione', cX.desc + 4, y, { size: 8, b: true, color: grey });
  right('Q.tà', cX.qty + 20, y, { size: 8, b: true, color: grey });
  right('Prezzo', cX.price + 30, y, { size: 8, b: true, color: grey });
  right('IVA', cX.vat + 20, y, { size: 8, b: true, color: grey });
  right('Importo', cX.tot, y, { size: 8, b: true, color: grey });
  y -= 18;

  for (const it of items) {
    const rowNet = round2((Number(it.qty) || 0) * (Number(it.price) || 0) * (1 - (Number(it.discount_perc) || 0) / 100));
    // wrap descrizione a ~64 char
    const descFull = it.description || '';
    const maxChars = 64;
    const descLines: string[] = [];
    let rest = descFull;
    while (rest.length > maxChars) { descLines.push(rest.slice(0, maxChars)); rest = rest.slice(maxChars); }
    descLines.push(rest);
    text(descLines[0] || '', cX.desc + 4, y, { size: 8 });
    right(String(it.qty), cX.qty + 20, y, { size: 8 });
    right(money(it.price), cX.price + 30, y, { size: 8 });
    const vatLabel = (Number(it.vat_perc) || 0) === 0 ? (it.vat_nature || '0%') : `${it.vat_perc}%`;
    right(vatLabel, cX.vat + 20, y, { size: 8 });
    right(money(rowNet), cX.tot, y, { size: 8 });
    y -= 12;
    for (let i = 1; i < descLines.length; i++) { text(descLines[i], cX.desc + 4, y, { size: 8, color: grey }); y -= 11; }
    if ((Number(it.discount_perc) || 0) > 0) { text(`sconto ${it.discount_perc}%`, cX.desc + 4, y, { size: 7, color: grey }); y -= 10; }
    y -= 2;
  }
  y -= 2; hr(y); y -= 16;

  // ── Riepilogo IVA per aliquota ──
  text('Riepilogo IVA', M, y, { size: 8, b: true, color: grey }); y -= 13;
  right('Imponibile', 400, y, { size: 8, color: grey });
  right('Imposta', W - M, y, { size: 8, color: grey });
  y -= 12;
  for (const g of totals.riepilogo) {
    const lbl = g.aliquota === 0 ? `Aliq. 0% ${g.natura ? '(' + g.natura + ')' : ''}` : `Aliq. ${g.aliquota}%`;
    text(lbl, M, y, { size: 8 });
    right(money(g.imponibile), 400, y, { size: 8 });
    right(money(g.imposta), W - M, y, { size: 8 });
    y -= 12;
  }
  y -= 4; hr(y); y -= 16;

  // ── Totali ──
  const totBoxX = 360;
  text('Imponibile', totBoxX, y, { size: 9, color: grey }); right(money(totals.imponibile), W - M, y, { size: 9 }); y -= 14;
  text('IVA', totBoxX, y, { size: 9, color: grey }); right(money(totals.imposta), W - M, y, { size: 9 }); y -= 14;
  if (totals.bollo > 0) { text('Bollo', totBoxX, y, { size: 9, color: grey }); right(money(totals.bollo), W - M, y, { size: 9 }); y -= 14; }
  page.drawRectangle({ x: totBoxX - 8, y: y - 6, width: (W - M) - (totBoxX - 8), height: 20, color: band });
  text('TOTALE', totBoxX, y, { size: 11, b: true }); right(money(totals.totale), W - M, y, { size: 11, b: true }); y -= 26;

  // ── Pagamento ──
  if (pagamento && (pagamento.modalita || pagamento.scadenza || pagamento.iban)) {
    hr(y); y -= 16;
    text('Pagamento', M, y, { size: 8, b: true, color: grey }); y -= 13;
    if (pagamento.modalita) {
      const pm = PAYMENT_MODES.find((m) => m.value === pagamento.modalita);
      text(`Modalità: ${pm ? pm.label : pagamento.modalita}`, M, y, { size: 8 }); y -= 11;
    }
    if (pagamento.scadenza) { text(`Scadenza: ${fmtDate(pagamento.scadenza)}`, M, y, { size: 8 }); y -= 11; }
    if (pagamento.iban) { text(`IBAN: ${pagamento.iban}`, M, y, { size: 8 }); y -= 11; }
    y -= 4;
  }

  // ── Note ──
  if (invoice.note_external) {
    hr(y); y -= 16;
    text('Note', M, y, { size: 8, b: true, color: grey }); y -= 13;
    for (const l of String(invoice.note_external).split('\n').slice(0, 6)) { text(l.slice(0, 110), M, y, { size: 8, color: grey }); y -= 11; }
  }

  // ── Footer ──
  text('Documento di cortesia. L’originale fiscale è il file XML trasmesso al Sistema di Interscambio (SDI).', M, 40, { size: 7, color: grey });

  const bytes = await doc.save();
  const filename = `${(invoice.number || 'fattura').replace(/[^\w.-]+/g, '_')}.pdf`;
  return { bytes, filename };
}

// ───────────────────────── XML FatturaPA 1.2.2 ──────────────────────────────
// Genera il file XML fiscale conforme (per verifica/anteprima). L'invio reale
// allo SDI resta la Fase 2 (proxy a sdi-ws /send-from-db). Struttura corretta:
// DatiRiepilogo per aliquota+Natura, Sede dal jsonb, DatiBollo, e per le
// autofatture (TD16/17/18) cedente/cessionario invertiti (cedente = fornitore).

function xesc(s: any): string {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function num2(n: any): string { return (Number(n) || 0).toFixed(2); }

interface XmlParty {
  denom: string; piva: string | null; cf: string | null; regime: string | null;
  pec: string | null; codDest: string | null; address: any;
}
function sedeXml(address: any): string {
  const a = address || {};
  const indirizzo = [a.street, a.civico].filter(Boolean).join(' ').trim() || 'ND';
  return `<Sede>
        <Indirizzo>${xesc(indirizzo)}</Indirizzo>
        <CAP>${xesc((a.zip || '00000').toString().replace(/\D/g, '').padStart(5, '0').slice(0, 5))}</CAP>
        <Comune>${xesc(a.city || 'ND')}</Comune>
        ${a.province ? `<Provincia>${xesc(String(a.province).toUpperCase().slice(0, 2))}</Provincia>` : ''}
        <Nazione>${xesc((a.country || 'IT').toString().toUpperCase().slice(0, 2))}</Nazione>
      </Sede>`;
}

/** Genera l'XML FatturaPA per una fattura (TD01) o autofattura (TD16/17/18). */
export async function buildFatturaPaXml(id: string): Promise<{ xml: string; filename: string } | null> {
  const detail = await loadInvoiceDetail(id);
  if (!detail) return null;
  const { invoice, items, totals, kind, meta, controparte, pagamento } = detail;
  if (kind === 'passiva') return null; // le passive non le emettiamo noi

  const emitter = await loadCustomerFiscal(EMITTER_ORG_ID);
  const emitterParty: XmlParty = {
    denom: emitter?.name || 'RescueManager S.R.L.', piva: emitter?.vat || null, cf: emitter?.tax_code || null,
    regime: emitter?.regime_fiscale || 'RF01', pec: emitter?.pec || null, codDest: emitter?.codice_destinatario || null,
    address: emitter?.address || null,
  };
  const controParty: XmlParty = {
    denom: controparte?.denominazione || invoice.customer_name || 'ND',
    piva: controparte?.partita_iva || invoice.customer_vat || null,
    cf: controparte?.codice_fiscale || invoice.customer_tax_code || null,
    regime: controparte?.regime_fiscale || 'RF01',
    pec: controparte?.pec || null, codDest: controparte?.codice_destinatario || null,
    address: invoice.customer_address || null,
  };

  const isAuto = kind === 'autofattura';
  const cedente = isAuto ? controParty : emitterParty;       // chi emette (per autofattura: il fornitore)
  const cessionario = isAuto ? emitterParty : controParty;   // il committente
  const tipoDoc = meta?.sdi?.documento?.tipo_documento || (isAuto ? 'TD16' : 'TD01');

  // Destinatario telematico: per la fattura è il cliente, per l'autofattura siamo noi.
  const recipient = isAuto ? emitterParty : controParty;
  const codDest = (recipient.codDest || '0000000').toUpperCase();
  const pecDest = codDest === '0000000' ? recipient.pec : null;

  // Progressivo invio (alfanumerico) dal numero documento.
  const numDigits = (invoice.number || '').replace(/\D/g, '') || '1';
  const prog = (parseInt(numDigits.slice(-8), 10) || 1).toString(36).toUpperCase().padStart(5, '0').slice(-5);
  const idTrasmittente = process.env.SDI_ID_NODO || emitterParty.piva || '02166430856';

  const righe = items.map((it, i) => {
    const disc = Number(it.discount_perc) || 0;
    const net = round2((Number(it.qty) || 0) * (Number(it.price) || 0) * (1 - disc / 100));
    const aliquota = Number(it.vat_perc) || 0;
    const natura = aliquota === 0 ? (it.vat_nature || null) : null;
    return `      <DettaglioLinee>
        <NumeroLinea>${i + 1}</NumeroLinea>
        <Descrizione>${xesc(it.description)}</Descrizione>
        <Quantita>${num2(it.qty)}</Quantita>
        <UnitaMisura>PZ</UnitaMisura>
        <PrezzoUnitario>${num2(it.price)}</PrezzoUnitario>${disc > 0 ? `
        <ScontoMaggiorazione><Tipo>SC</Tipo><Percentuale>${num2(disc)}</Percentuale></ScontoMaggiorazione>` : ''}
        <PrezzoTotale>${num2(net)}</PrezzoTotale>
        <AliquotaIVA>${num2(aliquota)}</AliquotaIVA>${natura ? `
        <Natura>${xesc(natura)}</Natura>` : ''}
      </DettaglioLinee>`;
  }).join('\n');

  const riepiloghi = totals.riepilogo.map((g) => `      <DatiRiepilogo>
        <AliquotaIVA>${num2(g.aliquota)}</AliquotaIVA>${g.aliquota === 0 && g.natura ? `
        <Natura>${xesc(g.natura)}</Natura>` : ''}
        <ImponibileImporto>${num2(g.imponibile)}</ImponibileImporto>
        <Imposta>${num2(g.imposta)}</Imposta>${g.aliquota > 0 ? `
        <EsigibilitaIVA>I</EsigibilitaIVA>` : ''}
      </DatiRiepilogo>`).join('\n');

  const bolloXml = totals.bollo > 0 ? `
        <DatiBollo>
          <BolloVirtuale>SI</BolloVirtuale>
          <ImportoBollo>${num2(totals.bollo)}</ImportoBollo>
        </DatiBollo>` : '';
  const causale = meta?.causale ? `
        <Causale>${xesc(String(meta.causale).slice(0, 200))}</Causale>` : '';

  const pagamentoXml = (pagamento && (pagamento.modalita || pagamento.iban || pagamento.scadenza)) ? `
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${xesc(pagamento.modalita || 'MP05')}</ModalitaPagamento>${pagamento.scadenza ? `
        <DataScadenzaPagamento>${xesc(String(pagamento.scadenza).slice(0, 10))}</DataScadenzaPagamento>` : ''}
        <ImportoPagamento>${num2(totals.totale)}</ImportoPagamento>${pagamento.iban ? `
        <IBAN>${xesc(String(pagamento.iban).replace(/\s+/g, ''))}</IBAN>` : ''}
      </DettaglioPagamento>
    </DatiPagamento>` : '';

  const anagrafica = (p: XmlParty, withRegime: boolean) => `<DatiAnagrafici>
        ${p.piva ? `<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${xesc(p.piva)}</IdCodice></IdFiscaleIVA>` : ''}
        ${p.cf ? `<CodiceFiscale>${xesc(p.cf)}</CodiceFiscale>` : ''}
        <Anagrafica><Denominazione>${xesc(p.denom)}</Denominazione></Anagrafica>${withRegime ? `
        <RegimeFiscale>${xesc(p.regime || 'RF01')}</RegimeFiscale>` : ''}
      </DatiAnagrafici>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${xesc(idTrasmittente)}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${xesc(prog)}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>${xesc(codDest)}</CodiceDestinatario>${pecDest ? `
      <PECDestinatario>${xesc(pecDest)}</PECDestinatario>` : ''}
    </DatiTrasmissione>
    <CedentePrestatore>
      ${anagrafica(cedente, true)}
      ${sedeXml(cedente.address)}
    </CedentePrestatore>
    <CessionarioCommittente>
      ${anagrafica(cessionario, false)}
      ${sedeXml(cessionario.address)}
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${xesc(tipoDoc)}</TipoDocumento>
        <Divisa>${xesc(invoice.currency || 'EUR')}</Divisa>
        <Data>${xesc(String(invoice.date).slice(0, 10))}</Data>
        <Numero>${xesc(invoice.number || '1')}</Numero>${bolloXml}
        <ImportoTotaleDocumento>${num2(totals.totale)}</ImportoTotaleDocumento>${causale}
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
${righe}
${riepiloghi}
    </DatiBeniServizi>${pagamentoXml}
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;

  const cc = (idTrasmittente || 'IT').replace(/[^\w]/g, '');
  const filename = `IT${cc}_${prog}.xml`;
  return { xml, filename };
}
