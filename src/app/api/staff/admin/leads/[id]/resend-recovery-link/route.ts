/**
 * Proxy → VPS lead-api: POST /api/leads/:id/resend-recovery-link
 * La chiave lead-api resta SOLO lato server (VPS_API_KEY). Richiede staff auth.
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

const LEAD_API_URL = (process.env.LEAD_API_URL || 'https://lead-api.rescuemanager.eu').replace(/^http:/, 'https:');
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  }
  try {
    const body = await request.json();
    const r = await fetch(`${LEAD_API_URL}/api/leads/${params.id}/resend-recovery-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': VPS_API_KEY },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status, headers: corsHeaders(origin) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Errore comunicazione VPS', details: error.message },
      { status: 502, headers: corsHeaders(origin) },
    );
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
