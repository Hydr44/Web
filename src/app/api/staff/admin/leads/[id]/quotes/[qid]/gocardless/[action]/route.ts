// Proxy staff → VPS lead-api per GoCardless (F4).
// Azioni: redirect-flow (avvia mandato SEPA), complete (ottiene mandate_id),
// charge (primo addebito + eventuale subscription se auto_renew). Il token
// GoCardless vive SOLO sul lead-api (VPS); qui inoltriamo con x-api-key.
// Auth staff garantita dal middleware su /api/staff/admin/*.

import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { createAuditLog } from '@/lib/staff-audit';

const LEAD_API_URL = (process.env.LEAD_API_URL || 'https://lead-api.rescuemanager.eu').replace(/^http:/, 'https:');
const VPS_API_KEY = process.env.VPS_API_KEY || '';

const ALLOWED = new Set(['redirect-flow', 'complete', 'charge']);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; qid: string; action: string } },
) {
  const origin = request.headers.get('origin');
  const { id, qid, action } = params;

  if (!ALLOWED.has(action)) {
    return NextResponse.json(
      { success: false, error: 'Azione GoCardless non valida' },
      { status: 400, headers: corsHeaders(origin) },
    );
  }
  // Fail-fast chiaro se la chiave VPS manca (altrimenti il lead-api dà 401 opaco).
  if (!VPS_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'VPS_API_KEY non configurata sul website' },
      { status: 503, headers: corsHeaders(origin) },
    );
  }

  try {
    const body = await request.text(); // inoltra il body così com'è
    const response = await fetch(
      `${LEAD_API_URL}/api/leads/${id}/quotes/${qid}/gocardless/${action}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': VPS_API_KEY },
        body: body || '{}',
      },
    );
    const data = await response.json().catch(() => ({}));

    // Audit dell'addebito (movimento di denaro reale) — chi/quando/esito.
    if (action === 'charge') {
      try {
        const staff = await getStaffFromRequest(request);
        if (staff) {
          await createAuditLog(
            staff.sub, staff.full_name, staff.role,
            'billing.payment', 'gocardless_charge', qid, `lead ${id}`,
            { amount_cents: (() => { try { return JSON.parse(body || '{}').amount; } catch { return null; } })(), status: response.status, payment_id: data?.payment_id, subscription_id: data?.subscription_id },
            request, response.ok,
          );
        }
      } catch { /* audit best-effort, non blocca */ }
    }

    return NextResponse.json(data, { status: response.status, headers: corsHeaders(origin) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore comunicazione VPS', details: error instanceof Error ? error.message : 'unknown' },
      { status: 502, headers: corsHeaders(origin) },
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
