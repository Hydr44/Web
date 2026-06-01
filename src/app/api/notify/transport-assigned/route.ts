/**
 * POST /api/notify/transport-assigned
 *
 * Invia una push notification all'app mobile dell'autista quando viene
 * assegnato/modificato un trasporto. Chiamato dal desktop subito dopo
 * UPDATE transports.driver_id (fire-and-forget).
 *
 * Pipeline:
 *   1. Bearer (operatore dell'org del trasporto)
 *   2. Carica transport + staff_driver + profiles.push_token
 *   3. POST a Expo Push API (https://exp.host/--/api/v2/push/send)
 *
 * Auth: Bearer Supabase di un membro dell'org.
 *
 * Body:
 *   {
 *     transport_id: string,
 *     event?: 'assigned' | 'updated' | 'cancelled'  // default 'assigned'
 *   }
 *
 * Risposta 200: { success: true, sent: boolean, reason?: string }
 * - sent=false con reason quando il driver non ha push_token o non è collegato.
 *   Non è un errore: l'admin desktop tipicamente ignora il caso.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...(origin ? { Vary: 'Origin' } : {}),
  };
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders(req.headers.get('origin')) });
}

interface Body {
  transport_id?: string;
  event?: 'assigned' | 'updated' | 'cancelled';
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  // 1. Auth
  const auth = request.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401, headers: cors });
  }
  const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !userData?.user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401, headers: cors });
  }
  const callerId = userData.user.id;

  // 2. Body
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400, headers: cors });
  }
  const transportId = String(body.transport_id || '').trim();
  const event = body.event || 'assigned';
  if (!transportId) {
    return NextResponse.json({ error: 'transport_id mancante' }, { status: 400, headers: cors });
  }

  // 3. Carica transport
  const { data: tr, error: trErr } = await supabaseAdmin
    .from('transports')
    .select('id, number, org_id, driver_id, pickup_address, dropoff_address, status, customer_name')
    .eq('id', transportId)
    .maybeSingle();
  if (trErr || !tr) {
    return NextResponse.json({ error: 'Trasporto non trovato' }, { status: 404, headers: cors });
  }

  // 4. Membership check
  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('role')
    .eq('user_id', callerId)
    .eq('org_id', tr.org_id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: 'Non sei membro di questa organizzazione' },
      { status: 403, headers: cors },
    );
  }

  if (!tr.driver_id) {
    return NextResponse.json({ success: true, sent: false, reason: 'no_driver_assigned' }, { headers: cors });
  }

  // 5. Lookup staff_driver → auth_user_id → profiles.push_token
  const { data: drv } = await supabaseAdmin
    .from('staff_drivers')
    .select('id, auth_user_id, nome, cognome, mobile_status')
    .eq('id', tr.driver_id)
    .maybeSingle();
  if (!drv || !drv.auth_user_id || drv.mobile_status !== 'active') {
    return NextResponse.json(
      { success: true, sent: false, reason: 'driver_not_active' },
      { headers: cors },
    );
  }

  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('push_token')
    .eq('id', drv.auth_user_id)
    .maybeSingle();
  const pushToken = prof?.push_token;
  if (!pushToken) {
    return NextResponse.json(
      { success: true, sent: false, reason: 'no_push_token' },
      { headers: cors },
    );
  }

  // 6. Costruzione messaggio
  const transportNum = tr.number ? `TR${String(tr.number).padStart(4, '0')}` : `#${tr.id.slice(0, 6)}`;
  const titles: Record<string, string> = {
    assigned: 'Nuovo trasporto assegnato',
    updated: 'Trasporto aggiornato',
    cancelled: 'Trasporto annullato',
  };
  const bodyText = [
    transportNum,
    tr.customer_name ? `· ${tr.customer_name}` : null,
    tr.pickup_address ? `\nDa: ${tr.pickup_address}` : null,
    tr.dropoff_address ? `\nA: ${tr.dropoff_address}` : null,
  ].filter(Boolean).join(' ');

  // 7. POST a Expo Push API. È un'API pubblica gratuita: nessun token
  // richiesto, ma c'è rate-limit (~600 req/min). Per volumi alti useremo
  // Expo Server SDK + accessToken (env EXPO_ACCESS_TOKEN).
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...(process.env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        to: pushToken,
        title: titles[event] || 'Aggiornamento trasporto',
        body: bodyText,
        sound: 'default',
        priority: 'high',
        data: { type: 'transport', transportId: tr.id, event },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[notify/transport-assigned] Expo Push KO:', res.status, text.slice(0, 300));
      return NextResponse.json(
        { success: false, error: `Expo Push HTTP ${res.status}` },
        { status: 502, headers: cors },
      );
    }
    const payload = await res.json().catch(() => null);
    // Expo restituisce {data: {status: 'ok'|'error', ...}}. Se DeviceNotRegistered,
    // dovremmo invalidare il token (skip per ora — il mobile lo rigenera al login).
    const status = payload?.data?.status;
    if (status === 'error') {
      console.warn('[notify/transport-assigned] Expo Push status=error:', payload?.data);
      return NextResponse.json(
        { success: true, sent: false, reason: payload?.data?.message || 'expo_error' },
        { headers: cors },
      );
    }
    return NextResponse.json({ success: true, sent: true }, { headers: cors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[notify/transport-assigned] fetch fail:', msg);
    return NextResponse.json(
      { success: false, error: 'Errore invio notifica' },
      { status: 500, headers: cors },
    );
  }
}
