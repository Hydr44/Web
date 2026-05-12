/**
 * Proxy: POST /api/leads/:id/first-contact
 * Segna primo contatto del lead (data + canale)
 */
import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

const LEAD_API_URL = process.env.LEAD_API_URL || 'http://lead-api.rescuemanager.eu';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const r = await fetch(`${LEAD_API_URL}/api/leads/${params.id}/first-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': VPS_API_KEY },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await r.json(), { status: r.status, headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
