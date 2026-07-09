/**
 * GET /api/staff/admin/invoices/:id/xml
 * Genera al volo l'XML FatturaPA 1.2.2 (per verifica/anteprima) di una
 * fattura (TD01) o autofattura (TD16/17/18). Non trasmette nulla allo SDI:
 * l'invio reale è la Fase 2 (proxy a sdi-ws /send-from-db).
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { buildFatturaPaXml, loadInvoiceDetail, EMITTER_ORG_ID } from '@/lib/admin-invoices';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  try {
    const detail = await loadInvoiceDetail(params.id);
    if (!detail || detail.invoice.org_id !== EMITTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404, headers });
    }
    const out = await buildFatturaPaXml(params.id);
    if (!out) {
      // Passive: non le emettiamo noi → serviamo l'XML RICEVUTO, estratto dal
      // file firmato .p7m e salvato in meta.sdi_xml dallo sdi-processor (VPS).
      const receivedXml = (detail.meta as { sdi_xml?: string } | null)?.sdi_xml;
      if (receivedXml) {
        return new NextResponse(String(receivedXml), {
          status: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/xml; charset=utf-8',
            'Content-Disposition': `attachment; filename="${detail.invoice.number || 'fattura'}.xml"`,
            'Cache-Control': 'no-store',
          },
        });
      }
      return NextResponse.json({ success: false, error: 'XML non ancora disponibile (in attesa di ricezione/elaborazione SDI)' }, { status: 400, headers });
    }
    return new NextResponse(out.xml, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${out.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    console.error('[admin invoice xml] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
