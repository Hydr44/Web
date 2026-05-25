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
 * Body (uno di driver_id OR staff_driver_id obbligatorio):
 *   {
 *     // Caso 1: driver moderno (tabella `drivers`, usata dal mobile)
 *     driver_id?: string,
 *
 *     // Caso 2: driver legacy (tabella `staff_drivers`, usata dal desktop)
 *     staff_driver_id?: string,
 *
 *     operator_email?: string,  // override email (default = staff_drivers.email se staff_driver_id)
 *     ttl_seconds?: number      // override TTL (default 300, max 900)
 *   }
 *
 * Response 200:
 *   {
 *     success: true,
 *     token: string,
 *     qr_url: string,             // rescuemanager://pair?token=...
 *     qr_png_data_url: string,    // data:image/png;base64,...
 *     expires_at: ISO,
 *     driver_id?: string,
 *     staff_driver_id?: string,
 *     operator_email: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { signPairingToken, buildDeepLink, type PairingPrefill } from '@/lib/pairing-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 900;

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
  staff_driver_id?: string;
  operator_email?: string;
  ttl_seconds?: number;
}

interface DriverRecord {
  org_id: string;
  email?: string;
  prefill: PairingPrefill;
}

/** Lookup driver da staff_drivers o drivers — almeno uno dei due deve essere fornito */
async function resolveDriver(body: Body): Promise<DriverRecord | { error: string; status: number; debug?: unknown }> {
  if (body.staff_driver_id) {
    const { data: sd, error: sdErr } = await supabaseAdmin
      .from('staff_drivers')
      .select('id, org_id, nome, cognome, telefono, email, patente, patente_scadenza')
      .eq('id', body.staff_driver_id)
      .maybeSingle();

    if (sdErr) {
      // PGRST: "relation does not exist" o RLS denial → log + 500
      console.error('[pair/generate] staff_drivers query error:', sdErr);
      return {
        error: `Errore query staff_drivers: ${sdErr.message}`,
        status: 500,
        debug: { code: sdErr.code, details: sdErr.details, hint: sdErr.hint, queried_id: body.staff_driver_id },
      };
    }
    if (!sd) {
      return {
        error: `staff_driver non trovato (id: ${body.staff_driver_id}). Verifica che il record esista nello stesso Supabase a cui punta rescuemanager.eu (prod).`,
        status: 404,
        debug: { queried_id: body.staff_driver_id, table: 'staff_drivers' },
      };
    }
    const fullName = [sd.nome, sd.cognome].filter(Boolean).join(' ').trim();
    return {
      org_id: sd.org_id,
      email: sd.email || undefined,
      prefill: {
        name: fullName || undefined,
        phone: sd.telefono || undefined,
        license_no: sd.patente || undefined,
        license_expiry: sd.patente_scadenza || undefined,
      },
    };
  }
  if (body.driver_id) {
    const { data: dr, error: drErr } = await supabaseAdmin
      .from('drivers')
      .select('id, org_id, name, phone, license_no, license_expiry')
      .eq('id', body.driver_id)
      .maybeSingle();
    if (drErr) {
      console.error('[pair/generate] drivers query error:', drErr);
      return {
        error: `Errore query drivers: ${drErr.message}`,
        status: 500,
        debug: { code: drErr.code, queried_id: body.driver_id },
      };
    }
    if (!dr) {
      return {
        error: `driver non trovato (id: ${body.driver_id})`,
        status: 404,
        debug: { queried_id: body.driver_id, table: 'drivers' },
      };
    }
    return {
      org_id: dr.org_id,
      prefill: {
        name: dr.name || undefined,
        phone: dr.phone || undefined,
        license_no: dr.license_no || undefined,
        license_expiry: dr.license_expiry || undefined,
      },
    };
  }
  return { error: 'driver_id o staff_driver_id obbligatorio', status: 400 };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  // 1. Auth: Bearer Supabase access_token
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

  // 3. Resolve driver (helper extracted per cognitive complexity)
  const resolvedOrErr = await resolveDriver(body);
  if ('error' in resolvedOrErr) {
    return NextResponse.json(
      { error: resolvedOrErr.error, debug: resolvedOrErr.debug },
      { status: resolvedOrErr.status, headers: cors },
    );
  }
  const resolved = resolvedOrErr;

  // 4. Org membership check (caller deve essere dell'org del driver)
  const { data: membership, error: memErr } = await supabaseAdmin
    .from('org_members')
    .select('role')
    .eq('user_id', callerId)
    .eq('org_id', resolved.org_id)
    .maybeSingle();

  if (memErr || !membership) {
    return NextResponse.json(
      { error: 'Non sei membro di questa organizzazione' },
      { status: 403, headers: cors },
    );
  }

  // 5. Email destinatario: override esplicito > staff_drivers.email > errore
  const operator_email = (body.operator_email || resolved.email)?.trim().toLowerCase();
  if (!operator_email) {
    return NextResponse.json(
      {
        error:
          'Email autista mancante. Aggiungi una email al driver in anagrafica oppure passa operator_email nella request.',
      },
      { status: 400, headers: cors },
    );
  }

  // 6. TTL
  const ttl = Math.min(Math.max(body.ttl_seconds ?? DEFAULT_TTL_SECONDS, 60), MAX_TTL_SECONDS);
  const expires_at = new Date(Date.now() + ttl * 1000).toISOString();

  // 7. Persist record
  const { data: tokenRow, error: insErr } = await supabaseAdmin
    .from('pairing_tokens')
    .insert({
      operator_email,
      org_id: resolved.org_id,
      driver_id: body.driver_id ?? null,
      staff_driver_id: body.staff_driver_id ?? null,
      prefill: resolved.prefill,
      generated_by: callerId,
      expires_at,
    })
    .select('jti')
    .single();

  if (insErr || !tokenRow) {
    console.error('[pair/generate] insert failed:', insErr?.message);
    return NextResponse.json({ error: 'Errore creazione token' }, { status: 500, headers: cors });
  }

  // 8. Firma JWT
  let signedToken: string;
  try {
    signedToken = await signPairingToken(
      {
        jti: tokenRow.jti,
        org_id: resolved.org_id,
        operator_email,
        driver_id: body.driver_id,
        prefill: resolved.prefill,
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

  // 9. QR PNG
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
      driver_id: body.driver_id,
      staff_driver_id: body.staff_driver_id,
      operator_email,
    },
    { headers: cors },
  );
}
