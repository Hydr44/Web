/**
 * Proxy to VPS lead-api: POST /api/leads/:id/quotes/:qid/activate
 * Attiva manualmente account post-pagamento (o senza, con skip_payment_check)
 */

import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

const LEAD_API_URL = (process.env.LEAD_API_URL || "https://lead-api.rescuemanager.eu").replace(/^http:/, "https:");
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const origin = request.headers.get('origin');
  // RBAC: l'attivazione (crea org/utenti/fattura) è riservata ai ruoli admin.
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  }
  if (!requireStaffRole(staff, 'admin', 'manager')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti per attivare' }, { status: 403, headers: corsHeaders(origin) });
  }
  try {
    const body = await request.json();
    const response = await fetch(`${LEAD_API_URL}/api/leads/${params.id}/quotes/${params.qid}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': VPS_API_KEY },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: corsHeaders(origin) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Errore comunicazione VPS', details: error.message },
      { status: 502, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
