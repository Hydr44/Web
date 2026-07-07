/**
 * Dettaglio / azioni su una fattura SaaS.
 *
 * GET    /api/staff/admin/invoices/:id   → testata + righe + totali + controparte
 * PATCH  /api/staff/admin/invoices/:id   → { payment_status: 'paid'|'unpaid' }  (segna pagata)
 * DELETE /api/staff/admin/invoices/:id   → elimina una BOZZA (solo sdi_status='draft')
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { EMITTER_ORG_ID, loadInvoiceDetail } from '@/lib/admin-invoices';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  try {
    const detail = await loadInvoiceDetail(params.id);
    if (!detail || detail.invoice.org_id !== EMITTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    }
    return NextResponse.json({ success: true, ...detail }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });
  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    if (body.payment_status === 'paid' || body.payment_status === 'unpaid') patch.payment_status = body.payment_status;
    if (!Object.keys(patch).length) return NextResponse.json({ success: false, error: 'Nessun campo aggiornabile' }, { status: 400, headers });

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update(patch)
      .eq('id', params.id)
      .eq('org_id', EMITTER_ORG_ID)
      .select('id, payment_status')
      .maybeSingle();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    if (!data) return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    return NextResponse.json({ success: true, invoice: data }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });
  try {
    const { data: inv } = await supabaseAdmin
      .from('invoices')
      .select('id, sdi_status, org_id')
      .eq('id', params.id)
      .maybeSingle();
    if (!inv || inv.org_id !== EMITTER_ORG_ID) return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    if ((inv.sdi_status || 'draft') !== 'draft') {
      return NextResponse.json({ success: false, error: 'Solo le bozze possono essere eliminate' }, { status: 409, headers });
    }
    await supabaseAdmin.from('invoice_items').delete().eq('invoice_id', params.id);
    const { error } = await supabaseAdmin.from('invoices').delete().eq('id', params.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    return NextResponse.json({ success: true }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
