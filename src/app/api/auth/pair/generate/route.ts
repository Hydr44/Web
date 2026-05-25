/**
 * POST /api/auth/pair/generate
 *
 * Chiamato dal DESKTOP CLIENTE (desktop-app/greeting-friend-api-main) dal
 * dispatcher dell'azienda quando vuole accoppiare un AUTISTA al suo mobile
 * per il GPS tracking.
 *
 * NON è uno endpoint staff: è authenticato come normale utente Supabase,
 * con verifica che il caller sia membro dell'org del driver.
 *
 * Auth:
 *   Header: Authorization: Bearer <supabase access_token>
 *
 * Body:
 *   {
 *     driver_id: string,        // UUID del driver in `drivers` (obbligatorio)
 *     operator_email: string,   // email personale del driver (per Supabase Auth)
 *     ttl_seconds?: number      // override TTL token (default 300 = 5min)
 *   }
 *
 * Response 200:
 *   {
 *     success: true,
 *     token: string,           // JWT raw
 *     qr_url: string,          // rescuemanager://pair?token=...
 *     qr_png_data_url: string, // data:image/png;base64,... per <img src>
 *     expires_at: ISO,
 *     driver_id: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { signPairingToken, buildDeepLink } from '@/lib/pairing-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 900; // 15 min

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...(origin ? { Vary: 'Origin' } : {}),
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders(req.headers.get('origin')) });
}

interface Body {
  driver_id?: string;
  operator_email?: string;
  ttl_seconds?: number;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  // 1. Auth: Bearer access_token Supabase
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

  const driver_id = body.driver_id?.trim();
  if (!driver_id) {
    return NextResponse.json({ error: 'driver_id obbligatorio' }, { status: 400, headers: cors });
  }

  // 3. Email destinatario obbligatoria (è l'identità Supabase del driver)
  const operator_email = body.operator_email?.trim().toLowerCase();
  if (!operator_email) {
    return NextResponse.json(
      { error: 'operator_email obbligatorio (email personale del driver)' },
      { status: 400, headers: cors },
    );
  }

  // 4. Trova driver + verifica org_membership del caller
  const { data: driver, error: drvErr } = await supabaseAdmin
    .from('drivers')
    .select('id, org_id, name, phone, license_no, license_expiry')
    .eq('id', driver_id)
    .maybeSingle();

  if (drvErr || !driver) {
    return NextResponse.json({ error: 'Driver non trovato' }, { status: 404, headers: cors });
  }

  const { data: membership, error: memErr } = await supabaseAdmin
    .from('org_members')
    .select('role')
    .eq('user_id', callerId)
    .eq('org_id', driver.org_id)
    .maybeSingle();

  if (memErr || !membership) {
    return NextResponse.json(
      { error: 'Non sei membro di questa organizzazione' },
      { status: 403, headers: cors },
    );
  }

  // 5. TTL
  const ttl = Math.min(Math.max(body.ttl_seconds ?? DEFAULT_TTL_SECONDS, 60), MAX_TTL_SECONDS);
  const expires_at = new Date(Date.now() + ttl * 1000).toISOString();

  // 6. Persist record
  const prefill = {
    name: driver.name,
    phone: driver.phone,
    license_no: driver.license_no,
    license_expiry: driver.license_expiry,
  };

  const { data: tokenRow, error: insErr } = await supabaseAdmin
    .from('pairing_tokens')
    .insert({
      operator_email,
      org_id: driver.org_id,
      driver_id,
      prefill,
      generated_by: callerId,
      expires_at,
    })
    .select('jti')
    .single();

  if (insErr || !tokenRow) {
    console.error('[pair/generate] insert failed:', insErr?.message);
    return NextResponse.json({ error: 'Errore creazione token' }, { status: 500, headers: cors });
  }

  // 7. Firma JWT
  let signedToken: string;
  try {
    signedToken = await signPairingToken(
      {
        jti: tokenRow.jti,
        org_id: driver.org_id,
        operator_email,
        driver_id,
        prefill,
      },
      ttl,
    );
  } catch (e) {
    console.error('[pair/generate] sign failed:', (e as Error).message);
    await supabaseAdmin.from('pairing_tokens').delete().eq('jti', tokenRow.jti);
    return NextResponse.json(
      { error: 'Errore firma token (verifica PAIRING_JWT_SECRET su Vercel)' },
      { status: 500, headers: cors },
    );
  }

  // 8. QR PNG
  const qr_url = buildDeepLink(signedToken);
  const qr_png_data_url = await QRCode.toDataURL(qr_url, {
    errorCorrectionLevel: 'M',
    width: 512,
    margin: 2,
    color: { dark: '#0F1724', light: '#FFFFFF' },
  });

  return NextResponse.json(
    {
      success: true,
      token: signedToken,
      qr_url,
      qr_png_data_url,
      expires_at,
      driver_id,
      operator_email,
    },
    { headers: cors },
  );
}
