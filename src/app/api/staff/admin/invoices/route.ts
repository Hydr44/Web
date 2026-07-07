/**
 * Fatturazione clienti (SaaS) — lista + creazione bozza.
 *
 * GET  /api/staff/admin/invoices?scope=attive|autofatture|passive|all
 * POST /api/staff/admin/invoices           → crea una BOZZA (invoice + invoice_items)
 *
 * La bozza NON viene inviata allo SDI (sdi_status='draft'). L'invio è una fase
 * successiva (proxy a sdi-ws /send-from-db). Solo lettura/scrittura sulle proprie
 * fatture: nessuna azione sui dati operativi dei clienti.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import {
  EMITTER_ORG_ID, SDI_PROVIDER, AUTOFATTURA_TIPI,
  nextSaasInvoiceNumber, nextAutofatturaNumber, computeTotals, loadCustomerFiscal, loadSupplierFiscal,
  listInvoices, type InvoiceItemInput, type InvoiceScope,
} from '@/lib/admin-invoices';

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });

  try {
    const raw = (request.nextUrl.searchParams.get('scope') || 'attive').toLowerCase();
    const scope: InvoiceScope = (['attive', 'autofatture', 'passive', 'all'] as const).includes(raw as any)
      ? (raw as InvoiceScope) : 'attive';
    const invoices = await listInvoices(scope);
    return NextResponse.json({ success: true, invoices }, { headers });
  } catch (e: any) {
    console.error('[admin invoices GET] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });
  }

  try {
    const body = await request.json();
    const mode: 'fattura' | 'autofattura' = body.mode === 'autofattura' ? 'autofattura' : 'fattura';
    const items: InvoiceItemInput[] = Array.isArray(body.items) ? body.items : [];
    const dateStr = body.date ? new Date(body.date).toISOString() : new Date().toISOString();
    const noteExternal = body.note_external ? String(body.note_external) : null;
    const causale = body.causale ? String(body.causale) : null;

    // Dati pagamento opzionali (DatiPagamento FatturaPA) → meta.pagamento.
    const pagamento: Record<string, unknown> | null = (body.modalita_pagamento || body.scadenza || body.iban)
      ? {
          modalita: body.modalita_pagamento ? String(body.modalita_pagamento) : null,
          scadenza: body.scadenza ? new Date(body.scadenza).toISOString().slice(0, 10) : null,
          iban: body.iban ? String(body.iban).replace(/\s+/g, '') : null,
        }
      : null;

    if (!items.length || items.some((i) => !i.description || !(Number(i.qty) > 0))) {
      return NextResponse.json({ success: false, error: 'Almeno una riga valida (descrizione + quantità) richiesta' }, { status: 400, headers });
    }
    // Natura IVA obbligatoria sulle righe con aliquota 0.
    if (items.some((i) => (Number(i.vat_perc) || 0) === 0 && !i.vat_nature)) {
      return NextResponse.json({ success: false, error: 'Le righe con IVA 0% richiedono la Natura (es. N6.9, N4, N2.2)' }, { status: 400, headers });
    }

    // Controparte + serie + tipo documento in base al modo.
    let counterparty: Awaited<ReturnType<typeof loadSupplierFiscal>>;
    let direction: 'active' | 'passive';
    let tipoDocumento: string;
    let makeNumber: (y: number) => Promise<string>;
    const metaExtra: Record<string, unknown> = {};

    if (mode === 'autofattura') {
      const supplierId = String(body.supplier_id || '').trim();
      const tipo = String(body.tipo_documento || '');
      if (!supplierId) return NextResponse.json({ success: false, error: 'Fornitore richiesto' }, { status: 400, headers });
      if (!AUTOFATTURA_TIPI.includes(tipo as typeof AUTOFATTURA_TIPI[number])) {
        return NextResponse.json({ success: false, error: `Tipo documento non valido (ammessi: ${AUTOFATTURA_TIPI.join(', ')})` }, { status: 400, headers });
      }
      counterparty = await loadSupplierFiscal(supplierId);
      if (!counterparty) return NextResponse.json({ success: false, error: 'Fornitore non trovato' }, { status: 404, headers });
      direction = 'passive'; tipoDocumento = tipo; makeNumber = nextAutofatturaNumber;
      metaExtra.autofattura = { supplier_id: supplierId };
    } else {
      const billedOrgId = String(body.billed_org_id || '').trim();
      if (!billedOrgId) return NextResponse.json({ success: false, error: 'Cliente (billed_org_id) richiesto' }, { status: 400, headers });
      const cust = await loadCustomerFiscal(billedOrgId);
      if (!cust) return NextResponse.json({ success: false, error: 'Cliente non trovato' }, { status: 404, headers });
      counterparty = { ...cust, paese: null };
      direction = 'active'; tipoDocumento = 'TD01'; makeNumber = nextSaasInvoiceNumber;
      metaExtra.saas = { billed_org_id: billedOrgId, plan: body.plan ? String(body.plan) : null, period: body.period ? String(body.period) : null };
    }

    const totals = computeTotals(items);
    const year = new Date(dateStr).getUTCFullYear();

    // Numerazione dedicata; retry su collisione (23505).
    let invoiceId: string | null = null;
    let number = '';
    for (let attempt = 0; attempt < 3 && !invoiceId; attempt++) {
      number = await makeNumber(year);
      const { data: inv, error: insErr } = await supabaseAdmin
        .from('invoices')
        .insert({
          org_id: EMITTER_ORG_ID,
          direction,
          provider_id: SDI_PROVIDER,
          number,
          date: dateStr,
          currency: 'EUR',
          total: totals.totale,
          customer_name: counterparty.name,
          customer_vat: counterparty.vat,
          customer_tax_code: counterparty.tax_code,
          customer_address: counterparty.address,
          sdi_status: 'draft',
          payment_status: 'unpaid',
          note_external: noteExternal,
          bollo_virtuale: totals.bollo > 0,
          bollo_importo: totals.bollo || null,
          meta: {
            ...metaExtra,
            imponibile: totals.imponibile,
            iva: totals.imposta,
            bollo: totals.bollo,
            riepilogo: totals.riepilogo,
            causale,
            ...(pagamento ? { pagamento } : {}),
            sdi: {
              controparte: {
                denominazione: counterparty.name, partita_iva: counterparty.vat, codice_fiscale: counterparty.tax_code,
                pec: counterparty.pec, codice_destinatario: counterparty.codice_destinatario, regime_fiscale: counterparty.regime_fiscale,
              },
              documento: { tipo_documento: tipoDocumento },
            },
          },
        })
        .select('id')
        .single();
      if (!insErr && inv) { invoiceId = inv.id; break; }
      if ((insErr as any)?.code !== '23505') {
        return NextResponse.json({ success: false, error: `Errore creazione: ${insErr?.message}` }, { status: 500, headers });
      }
    }
    if (!invoiceId) return NextResponse.json({ success: false, error: 'Impossibile assegnare un numero univoco' }, { status: 409, headers });

    // Righe
    const rows = items.map((it) => {
      const disc = Number(it.discount_perc) || 0;
      return {
        invoice_id: invoiceId,
        // Nelle fatture esistenti il testo riga sta in item_code (NOT NULL) ed è
        // ciò che il generatore XML usa come descrizione. item_description resta gemello.
        item_code: it.description,
        item_description: it.description,
        qty: Number(it.qty) || 1,
        price: Number(it.price) || 0,
        vat_perc: Number(it.vat_perc) || 0,
        vat_nature: (Number(it.vat_perc) || 0) === 0 ? (it.vat_nature || null) : null,
        discount_type: disc > 0 ? 'percent' : null,
        discount_value: disc > 0 ? disc : null,
      };
    });
    const { error: itemsErr } = await supabaseAdmin.from('invoice_items').insert(rows);
    if (itemsErr) {
      // rollback best-effort della testata per non lasciare fatture senza righe
      await supabaseAdmin.from('invoices').delete().eq('id', invoiceId);
      return NextResponse.json({ success: false, error: `Errore righe fattura: ${itemsErr.message}` }, { status: 500, headers });
    }

    return NextResponse.json({
      success: true,
      invoice: { id: invoiceId, number, total: totals.totale, imponibile: totals.imponibile, iva: totals.imposta, sdi_status: 'draft' },
    }, { headers });
  } catch (e: any) {
    console.error('[admin invoices POST] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
