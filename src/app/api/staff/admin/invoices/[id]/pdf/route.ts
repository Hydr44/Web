/**
 * GET /api/staff/admin/invoices/:id/pdf
 * Genera al volo il PDF (fattura di cortesia) di una fattura/autofattura SaaS.
 * L'originale fiscale resta il file XML trasmesso allo SDI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { buildInvoicePdf, loadInvoiceDetail, EMITTER_ORG_ID } from '@/lib/admin-invoices';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  try {
    const detail = await loadInvoiceDetail(params.id);
    if (!detail || detail.invoice.org_id !== EMITTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    }
    const pdf = await buildInvoicePdf(params.id);
    if (!pdf) return NextResponse.json({ success: false, error: 'Impossibile generare il PDF' }, { status: 500, headers });
    return new NextResponse(Buffer.from(pdf.bytes), {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdf.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    console.error('[admin invoice pdf] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
