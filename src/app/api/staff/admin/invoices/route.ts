/**
 * Fatturazione clienti (SaaS) — lista + creazione bozza.
 *
 * GET  /api/staff/admin/invoices           → fatture SaaS (serie RM/, org emittente)
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
  EMITTER_ORG_ID, SAAS_PREFIX, AF_PREFIX, SDI_PROVIDER, AUTOFATTURA_TIPI,
  nextSaasInvoiceNumber, nextAutofatturaNumber, computeTotals, loadCustomerFiscal, loadSupplierFiscal,
  type InvoiceItemInput,
} from '@/lib/admin-invoices';

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });

  try {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('id, number, date, total, currency, sdi_status, payment_status, customer_name, customer_vat, direction, meta, created_at')
      .eq('org_id', EMITTER_ORG_ID)
      .or(`number.like.${SAAS_PREFIX}/%,number.like.${AF_PREFIX}/%`)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });

    const invoices = (data || []).map((r) => ({
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
      kind: r.direction === 'passive' ? 'autofattura' : 'fattura',
      tipo_documento: (r.meta as any)?.sdi?.documento?.tipo_documento || null,
      created_at: r.created_at,
    }));
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

    if (!items.length || items.some((i) => !i.description || !(Number(i.qty) > 0))) {
      return NextResponse.json({ success: false, error: 'Almeno una riga valida (descrizione + quantità) richiesta' }, { status: 400, headers });
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
          meta: {
            ...metaExtra,
            imponibile: totals.imponibile,
            iva: totals.iva,
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
    const rows = items.map((it) => ({
      invoice_id: invoiceId,
      // Nelle fatture esistenti il testo riga sta in item_code (NOT NULL) ed è
      // ciò che il generatore XML usa come descrizione. item_description resta gemello.
      item_code: it.description,
      item_description: it.description,
      qty: Number(it.qty) || 1,
      price: Number(it.price) || 0,
      vat_perc: Number(it.vat_perc) || 0,
    }));
    const { error: itemsErr } = await supabaseAdmin.from('invoice_items').insert(rows);
    if (itemsErr) {
      // rollback best-effort della testata per non lasciare fatture senza righe
      await supabaseAdmin.from('invoices').delete().eq('id', invoiceId);
      return NextResponse.json({ success: false, error: `Errore righe fattura: ${itemsErr.message}` }, { status: 500, headers });
    }

    return NextResponse.json({
      success: true,
      invoice: { id: invoiceId, number, total: totals.totale, imponibile: totals.imponibile, iva: totals.iva, sdi_status: 'draft' },
    }, { headers });
  } catch (e: any) {
    console.error('[admin invoices POST] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
