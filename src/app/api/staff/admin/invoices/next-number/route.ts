/**
 * GET /api/staff/admin/invoices/next-number?mode=fattura|autofattura&year=YYYY
 * Anteprima del prossimo numero documento (serie RM/ o AF/). Il numero
 * definitivo è comunque riassegnato al salvataggio (per evitare collisioni).
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { nextSaasInvoiceNumber, nextAutofatturaNumber } from '@/lib/admin-invoices';

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  try {
    const mode = (request.nextUrl.searchParams.get('mode') || 'fattura').toLowerCase();
    const yearRaw = parseInt(request.nextUrl.searchParams.get('year') || '', 10);
    const year = Number.isFinite(yearRaw) && yearRaw > 2000 ? yearRaw : new Date().getUTCFullYear();
    const number = mode === 'autofattura' ? await nextAutofatturaNumber(year) : await nextSaasInvoiceNumber(year);
    return NextResponse.json({ success: true, number }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
