/**
 * Proxy: GET /api/leads/:id/email/campaigns — storico email lead
 */

import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

const LEAD_API_URL = (process.env.LEAD_API_URL || "https://lead-api.rescuemanager.eu").replace(/^http:/, "https:");
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const response = await fetch(`${LEAD_API_URL}/api/leads/${params.id}/email/campaigns`, {
      headers: { 'x-api-key': VPS_API_KEY },
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
