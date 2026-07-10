/**
 * GET /api/staff/admin/invoices/:id/notifica/:tipo
 * Scarica l'XML di una notifica SdI (RC/NS/MC/DT/AT) associata alla fattura.
 * Le notifiche sono salvate in invoices.meta.sdi_notifiche[tipo] dallo sdi-processor (VPS).
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { loadInvoiceDetail, EMITTER_ORG_ID } from '@/lib/admin-invoices';

export async function GET(request: NextRequest, { params }: { params: { id: string; tipo: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  try {
    const detail = await loadInvoiceDetail(params.id);
    if (!detail || detail.invoice.org_id !== EMITTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    }
    const notifiche = (detail.meta as { sdi_notifiche?: Record<string, { xml?: string }> } | null)?.sdi_notifiche;
    const xml = notifiche?.[params.tipo]?.xml;
    if (!xml) {
      return NextResponse.json({ success: false, error: 'Notifica non disponibile' }, { status: 404, headers });
    }
    return new NextResponse(String(xml), {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${detail.invoice.number || 'fattura'}_${params.tipo}.xml"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    console.error('[admin invoice notifica] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
