/**
 * Proxy to VPS lead-api: POST /api/leads/:id/activate-demo
 * Attiva demo account per un lead
 */

import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

const LEAD_API_URL = process.env.LEAD_API_URL || 'http://lead-api.rescuemanager.eu';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();

    const response = await fetch(`${LEAD_API_URL}/api/leads/${params.id}/activate-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VPS_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: corsHeaders(origin),
    });
  } catch (error: any) {
    console.error('[PROXY] activate-demo error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore comunicazione server VPS', details: error.message },
      { status: 502, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
