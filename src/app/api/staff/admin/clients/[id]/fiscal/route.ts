/**
 * GET /api/staff/admin/clients/:id/fiscal
 * Anagrafica fiscale COMPLETA di un cliente (org) — i dati che finiranno nella
 * fattura e verranno trasmessi allo SDI. Sola lettura.
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { loadCustomerFiscal } from '@/lib/admin-invoices';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  const fiscal = await loadCustomerFiscal(params.id);
  if (!fiscal) return NextResponse.json({ success: false, error: 'Cliente non trovato' }, { status: 404, headers });
  return NextResponse.json({ success: true, fiscal }, { headers });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
