/**
 * Public appointment API (no auth) — usato dalla pagina pubblica /appointment/[uuid]
 * Proxy verso VPS che richiede comunque API key.
 */
import { NextResponse } from 'next/server';

const LEAD_API_URL = process.env.LEAD_API_URL || 'http://lead-api.rescuemanager.eu';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function GET(_request: Request, { params }: { params: { uuid: string } }) {
  try {
    const r = await fetch(`${LEAD_API_URL}/api/leads/appointments/public/${params.uuid}`, {
      headers: { 'x-api-key': VPS_API_KEY },
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: { params: { uuid: string } }) {
  try {
    const body = await request.json();
    const { action, ...rest } = body;
    const endpoint = action === 'cancel' ? 'cancel' : 'confirm';
    const r = await fetch(`${LEAD_API_URL}/api/leads/appointments/public/${params.uuid}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VPS_API_KEY,
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'user-agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify(rest),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502 });
  }
}
