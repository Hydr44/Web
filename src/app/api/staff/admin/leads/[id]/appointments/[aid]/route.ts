import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

const LEAD_API_URL = (process.env.LEAD_API_URL || "https://lead-api.rescuemanager.eu").replace(/^http:/, "https:");
const VPS_API_KEY = process.env.VPS_API_KEY || '';

async function proxy(method: string, path: string, origin: string | null, body?: unknown) {
  try {
    const r = await fetch(`${LEAD_API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-api-key': VPS_API_KEY },
      body: body ? JSON.stringify(body) : undefined,
    });
    return NextResponse.json(await r.json(), { status: r.status, headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502, headers: corsHeaders(origin) });
  }
}

export async function GET(request: Request, { params }: { params: { id: string; aid: string } }) {
  return proxy('GET', `/api/leads/${params.id}/appointments/${params.aid}`, request.headers.get('origin'));
}
export async function PUT(request: Request, { params }: { params: { id: string; aid: string } }) {
  return proxy('PUT', `/api/leads/${params.id}/appointments/${params.aid}`, request.headers.get('origin'), await request.json());
}
export async function DELETE(request: Request, { params }: { params: { id: string; aid: string } }) {
  const body = await request.json().catch(() => ({}));
  return proxy('DELETE', `/api/leads/${params.id}/appointments/${params.aid}`, request.headers.get('origin'), body);
}
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
