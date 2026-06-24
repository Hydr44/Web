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

  // 5. Risolvi i destinatari (push_token):
  //    - driver assegnato          → solo lui
  //    - nessun driver + 'created' → BROADCAST a tutti gli autisti attivi
  //      dell'org ("trasporto disponibile, da prendere in carico")
  const broadcast = !tr.driver_id && event === 'created';
  let pushTokens: string[] = [];

  if (tr.driver_id) {
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
    if (prof?.push_token) pushTokens = [prof.push_token];
    if (!pushTokens.length) {
      return NextResponse.json(
        { success: true, sent: false, reason: 'no_push_token' },
        { headers: cors },
      );
    }
  } else if (broadcast) {
    const { data: drivers } = await supabaseAdmin
      .from('staff_drivers')
      .select('auth_user_id')
      .eq('org_id', tr.org_id)
      .eq('mobile_status', 'active')
      .not('auth_user_id', 'is', null);
    const authIds = (drivers ?? []).map((d) => d.auth_user_id).filter(Boolean);
    if (authIds.length) {
      const { data: profs } = await supabaseAdmin
        .from('profiles')
        .select('push_token')
        .in('id', authIds);
      pushTokens = (profs ?? [])
        .map((p) => p.push_token)
        .filter((t): t is string => !!t);
    }
    if (!pushTokens.length) {
      return NextResponse.json(
        { success: true, sent: false, reason: 'no_active_drivers_with_token' },
        { headers: cors },
      );
    }
  } else {
    return NextResponse.json(
      { success: true, sent: false, reason: 'no_driver_assigned' },
      { headers: cors },
    );
  }

  // 6. Costruzione messaggio
  const transportNum = tr.number ? `TR${String(tr.number).padStart(4, '0')}` : `#${tr.id.slice(0, 6)}`;
  const titles: Record<string, string> = {
    assigned: 'Nuovo trasporto assegnato',
    created: 'Nuovo trasporto disponibile',
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
      // `to` accetta singolo token o array. Dedupe + cap a 100 (limite Expo
      // per richiesta). Stesso titolo/corpo per tutti i destinatari broadcast.
      body: JSON.stringify({
        to: [...new Set(pushTokens)].slice(0, 100),
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
    // Con `to` array Expo restituisce data: [{status}], con singolo data: {status}.
    // Normalizziamo a lista di ticket. DeviceNotRegistered → andrebbe invalidato
    // il token (skip per ora: il mobile lo rigenera al login).
    const data = payload?.data;
    const tickets: Array<{ status?: string; message?: string }> = Array.isArray(data)
      ? data
      : data
        ? [data]
        : [];
    const delivered = tickets.filter((t) => t?.status === 'ok').length;
    if (delivered === 0) {
      const firstErr = tickets.find((t) => t?.status === 'error');
      console.warn('[notify/transport-assigned] Expo Push 0 delivered:', firstErr ?? payload);
      return NextResponse.json(
        { success: true, sent: false, reason: firstErr?.message || 'expo_error' },
        { headers: cors },
      );
    }
    return NextResponse.json(
      { success: true, sent: true, recipients: tickets.length, delivered },
      { headers: cors },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[notify/transport-assigned] fetch fail:', msg);
    return NextResponse.json(
      { success: false, error: 'Errore invio notifica' },
      { status: 500, headers: cors },
    );
  }
}
