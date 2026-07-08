/**
 * POST /api/staff/admin/invoices/:id/send-test
 * Invia la fattura all'ambiente di TEST del SdI (nessun effetto legale), usando
 * l'XML generato dal website (buildFatturaPaXml) via sdi-ws /api/sdi/tx-auto:
 * il VPS firma e trasmette l'XML fornito, SENZA leggere dal DB → funziona con le
 * fatture di produzione. Non marca la fattura come inviata (è solo una prova).
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { EMITTER_ORG_ID, loadInvoiceDetail, buildFatturaPaXml } from '@/lib/admin-invoices';

const SDI_WS_TEST = process.env.SDI_WS_TEST_URL || 'https://sdi-api-test.rescuemanager.eu';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });

  try {
    const detail = await loadInvoiceDetail(params.id);
    if (!detail || detail.invoice.org_id !== EMITTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    }
    if (detail.kind === 'passiva') {
      return NextResponse.json({ success: false, error: 'Le fatture passive non si inviano' }, { status: 400, headers });
    }

    const built = await buildFatturaPaXml(params.id);
    if (!built) return NextResponse.json({ success: false, error: 'Impossibile generare l\'XML' }, { status: 500, headers });

    // tx-auto vuole il nomeFile NON firmato (aggiunge lui .p7m dopo la firma).
    const nomeFile = built.filename.replace(/\.p7m$/i, '');
    const contenutoBase64 = Buffer.from(built.xml, 'utf8').toString('base64');

    let wsRes: Response;
    try {
      wsRes = await fetch(`${SDI_WS_TEST}/api/sdi/tx-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeFile, contenutoBase64 }),
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `sdi-ws test non raggiungibile: ${e?.message || e}` }, { status: 502, headers });
    }

    const data = await wsRes.json().catch(() => ({}));
    if (!wsRes.ok || data?.ok === false) {
      return NextResponse.json({ success: false, error: data?.error || `sdi-ws HTTP ${wsRes.status}` }, { status: 422, headers });
    }
    return NextResponse.json({
      success: true,
      environment: 'TEST',
      identificativo_sdi: data?.esito?.IdentificativoSdI || null,
      nomeFile: data?.nomeFile || nomeFile,
      signature_id: data?.signatureId || null,
    }, { headers });
  } catch (e: any) {
    console.error('[admin invoice send-test] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
