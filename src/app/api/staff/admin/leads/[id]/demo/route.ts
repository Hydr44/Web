/**
 * Proxy to VPS lead-api: leads/:id/demo
 * GET - Stato demo per un lead
 */

import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

const LEAD_API_URL = process.env.LEAD_API_URL || 'http://lead-api.rescuemanager.eu';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const response = await fetch(`${LEAD_API_URL}/api/leads/${params.id}/demo`, {
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
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
