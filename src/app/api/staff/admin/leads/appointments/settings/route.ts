/**
 * Proxy: appointments settings (Calendly URL, follow-up defaults)
 */
import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

const LEAD_API_URL = process.env.LEAD_API_URL || 'https://api.rescuemanager.eu/lead-api';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const r = await fetch(`${LEAD_API_URL}/api/leads/appointments/settings`, {
      headers: { 'x-api-key': VPS_API_KEY }
    });
    return NextResponse.json(await r.json(), { status: r.status, headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502, headers: corsHeaders(origin) });
  }
}

export async function PUT(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const r = await fetch(`${LEAD_API_URL}/api/leads/appointments/settings`, {
      method: 'PUT',
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
