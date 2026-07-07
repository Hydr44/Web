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
  EMITTER_ORG_ID, SAAS_PREFIX, SDI_PROVIDER, nextSaasInvoiceNumber, computeTotals, loadCustomerFiscal,
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
      .select('id, number, date, total, currency, sdi_status, payment_status, customer_name, customer_vat, meta, created_at')
      .eq('org_id', EMITTER_ORG_ID)
      .like('number', `${SAAS_PREFIX}/%`)
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
    const billedOrgId = String(body.billed_org_id || '').trim();
    const items: InvoiceItemInput[] = Array.isArray(body.items) ? body.items : [];
    const dateStr = body.date ? new Date(body.date).toISOString() : new Date().toISOString();
    const plan = body.plan ? String(body.plan) : null;
    const period = body.period ? String(body.period) : null;
    const noteExternal = body.note_external ? String(body.note_external) : null;

    if (!billedOrgId) return NextResponse.json({ success: false, error: 'Cliente (billed_org_id) richiesto' }, { status: 400, headers });
    if (!items.length || items.some((i) => !i.description || !(Number(i.qty) > 0))) {
      return NextResponse.json({ success: false, error: 'Almeno una riga valida (descrizione + quantità) richiesta' }, { status: 400, headers });
    }

    // Dati fiscali del cliente destinatario
    const cust = await loadCustomerFiscal(billedOrgId);
    if (!cust) return NextResponse.json({ success: false, error: 'Cliente non trovato' }, { status: 404, headers });

    const totals = computeTotals(items);
    const year = new Date(dateStr).getUTCFullYear();

    // Crea la fattura con numerazione dedicata; retry su collisione numero (23505).
    let invoiceId: string | null = null;
    let number = '';
    for (let attempt = 0; attempt < 3 && !invoiceId; attempt++) {
      number = await nextSaasInvoiceNumber(year);
      const { data: inv, error: insErr } = await supabaseAdmin
        .from('invoices')
        .insert({
          org_id: EMITTER_ORG_ID,
          direction: 'active',
          provider_id: SDI_PROVIDER,
          number,
          date: dateStr,
          currency: 'EUR',
          total: totals.totale,
          customer_name: cust.name,
          customer_vat: cust.vat,
          customer_tax_code: cust.tax_code,
          customer_address: cust.address,
          sdi_status: 'draft',
          payment_status: 'unpaid',
          note_external: noteExternal,
          meta: {
            saas: { billed_org_id: billedOrgId, plan, period, imponibile: totals.imponibile, iva: totals.iva },
            sdi: {
              cessionario: {
                denominazione: cust.name, partita_iva: cust.vat, codice_fiscale: cust.tax_code,
                pec: cust.pec, codice_destinatario: cust.codice_destinatario, regime_fiscale: cust.regime_fiscale,
              },
              documento: { tipo_documento: 'TD01' },
            },
          },
        })
        .select('id')
        .single();
      if (!insErr && inv) { invoiceId = inv.id; break; }
      if ((insErr as any)?.code !== '23505') {
        return NextResponse.json({ success: false, error: `Errore creazione fattura: ${insErr?.message}` }, { status: 500, headers });
      }
      // collisione numero → ricalcola e riprova
    }
    if (!invoiceId) return NextResponse.json({ success: false, error: 'Impossibile assegnare un numero fattura univoco' }, { status: 409, headers });

    // Righe
    const rows = items.map((it) => ({
      invoice_id: invoiceId,
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
