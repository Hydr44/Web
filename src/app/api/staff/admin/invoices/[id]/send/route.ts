/**
 * POST /api/staff/admin/invoices/:id/send
 * Trasmette una fattura/autofattura allo SDI via il servizio VPS sdi-ws.
 * Il VPS (single source of truth) rigenera l'XML dal DB, firma (Namirial) e invia;
 * poi aggiorna invoices.sdi_status='sent' + meta.sdi_identificativo.
 *
 * Body: { env?: 'test' | 'prod' }  (default 'prod' — le fatture admin stanno nel
 *        Supabase di produzione, che il sdi-ws prod legge).
 *
 * SICUREZZA: l'invio in produzione è reale e legale (irreversibile → nota di credito).
 * Bloccato se l'anagrafica emittente è incompleta.
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { EMITTER_ORG_ID, loadInvoiceDetail, loadCustomerFiscal } from '@/lib/admin-invoices';

const SDI_WS_PROD = process.env.SDI_WS_PROD_URL || 'https://sdi-ws.rescuemanager.eu';
const SDI_WS_TEST = process.env.SDI_WS_TEST_URL || 'https://sdi-api-test.rescuemanager.eu';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });

  try {
    const body = await request.json().catch(() => ({}));
    const env: 'test' | 'prod' = body.env === 'test' ? 'test' : 'prod';

    const detail = await loadInvoiceDetail(params.id);
    if (!detail || detail.invoice.org_id !== EMITTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    }
    if (detail.kind === 'passiva') {
      return NextResponse.json({ success: false, error: 'Le fatture passive (ricevute) non si inviano' }, { status: 400, headers });
    }
    const status = detail.invoice.sdi_status || 'draft';
    if (status === 'sent' || status === 'validated' || status === 'received') {
      return NextResponse.json({ success: false, error: `Fattura già trasmessa (stato: ${status})` }, { status: 409, headers });
    }

    // Guard: l'emittente (cedente) deve avere i dati minimi, altrimenti l'XML è invalido.
    const emitter = await loadCustomerFiscal(EMITTER_ORG_ID);
    const addr: any = emitter?.address || {};
    const missing: string[] = [];
    if (!emitter?.vat?.trim()) missing.push('P.IVA');
    if (!emitter?.regime_fiscale?.trim()) missing.push('Regime fiscale');
    if (!addr.city?.trim()) missing.push('Comune sede');
    if (!addr.zip?.trim()) missing.push('CAP sede');
    if (missing.length) {
      return NextResponse.json({
        success: false,
        error: `Completa i dati emittente prima di inviare (mancanti: ${missing.join(', ')})`,
        code: 'EMITTER_INCOMPLETE',
        missing,
      }, { status: 422, headers });
    }

    const base = env === 'prod' ? SDI_WS_PROD : SDI_WS_TEST;
    let wsRes: Response;
    try {
      wsRes = await fetch(`${base}/api/sdi/send-from-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_ids: [params.id], org_id: EMITTER_ORG_ID }),
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `sdi-ws non raggiungibile: ${e?.message || e}` }, { status: 502, headers });
    }

    const data = await wsRes.json().catch(() => ({}));
    // sdi-ws: 200 tutto ok, 207 parziale, 4xx/5xx errore
    if (!wsRes.ok && wsRes.status !== 207) {
      return NextResponse.json({ success: false, error: data?.error || data?.message || `sdi-ws HTTP ${wsRes.status}` }, { status: 502, headers });
    }
    const first = (data.results && data.results[0]) || {};
    if (first.ok === false) {
      return NextResponse.json({ success: false, error: first.error || 'Invio non riuscito', code: first.code || null }, { status: 422, headers });
    }
    return NextResponse.json({
      success: true,
      environment: env === 'prod' ? 'PRODUCTION' : 'TEST',
      test_mode: data.test_mode === true,
      identificativo_sdi: first.identificativo_sdi || null,
      nomeFile: first.nomeFile || null,
      signature_id: first.signatureId || null,
    }, { headers });
  } catch (e: any) {
    console.error('[admin invoice send] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
