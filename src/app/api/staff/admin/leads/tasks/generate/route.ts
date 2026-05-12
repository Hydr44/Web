/**
 * POST /api/staff/admin/leads/tasks/generate
 * Trigger manuale generazione follow-up tasks
 */
import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

const LEAD_API_URL = process.env.LEAD_API_URL || 'https://api.rescuemanager.eu/lead-api';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const r = await fetch(`${LEAD_API_URL}/api/cron/generate-followups`, {
      method: 'POST',
      headers: { 'x-api-key': VPS_API_KEY, 'Content-Type': 'application/json' },
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status, headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
