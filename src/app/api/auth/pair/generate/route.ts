/**
 * POST /api/auth/pair/generate
 *
 * Chiamato dal pannello admin (desktop Electron) quando lo staff vuole
 * invitare un operatore. Genera un JWT firmato + ne fa il PNG QR code.
 *
 * Auth: richiede sessione staff valida (Bearer JWT in Authorization header).
 *
 * Body:
 *   {
 *     operator_email: string,
 *     org_id: string,
 *     driver_id?: string,
 *     prefill?: { name?, phone?, license_no?, license_expiry? }
 *   }
 *
 * Response 200:
 *   {
 *     token: string,            // JWT raw (per debug/manuale)
 *     qr_url: string,           // rescuemanager://pair?token=...
 *     qr_png_data_url: string,  // data:image/png;base64,... (renderizzabile in <img>)
 *     expires_at: ISO timestamp
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { signPairingToken, buildDeepLink, type PairingPrefill } from '@/lib/pairing-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBody {
  operator_email?: string;
  org_id?: string;
  driver_id?: string;
  prefill?: PairingPrefill;
}

const TTL_SECONDS = 300; // 5 minuti

export async function POST(request: NextRequest) {
  // 1. Auth: solo staff può generare pairing
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401 });
  }

  // 2. Body validation
  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON non valido' }, { status: 400 });
  }

  const operator_email = body.operator_email?.trim().toLowerCase();
  const org_id = body.org_id?.trim();
  if (!operator_email || !org_id) {
    return NextResponse.json(
      { success: false, error: 'operator_email e org_id obbligatori' },
      { status: 400 },
    );
  }

  // 3. Verifica che l'org esista (e che lo staff possa farlo — per ora basta che sia staff)
  const { data: org, error: orgErr } = await supabaseAdmin
    .from('orgs')
    .select('id, name')
    .eq('id', org_id)
    .maybeSingle();
  if (orgErr || !org) {
    return NextResponse.json(
      { success: false, error: 'Organizzazione non trovata' },
      { status: 404 },
    );
  }

  // 4. Persist record (jti generato da Postgres, lo recuperiamo in returning)
  const expires_at = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
  const { data: tokenRow, error: insErr } = await supabaseAdmin
    .from('pairing_tokens')
    .insert({
      operator_email,
      org_id,
      driver_id: body.driver_id ?? null,
      prefill: body.prefill ?? {},
      generated_by: staff.sub,
      expires_at,
    })
    .select('jti')
    .single();

  if (insErr || !tokenRow) {
    console.error('[pair/generate] insert failed:', insErr?.message);
    return NextResponse.json(
      { success: false, error: 'Errore creazione token' },
      { status: 500 },
    );
  }

  // 5. Firma JWT con jti = tokenRow.jti
  let token: string;
  try {
    token = await signPairingToken(
      {
        jti: tokenRow.jti,
        org_id,
        operator_email,
        driver_id: body.driver_id,
        prefill: body.prefill,
      },
      TTL_SECONDS,
    );
  } catch (e) {
    console.error('[pair/generate] sign failed:', (e as Error).message);
    // Best-effort cleanup del record orfano
    await supabaseAdmin.from('pairing_tokens').delete().eq('jti', tokenRow.jti);
    return NextResponse.json(
      { success: false, error: 'Errore firma token (verifica PAIRING_JWT_SECRET)' },
      { status: 500 },
    );
  }

  // 6. QR PNG (base64 data URL — il client lo mette in <img src>)
  const qr_url = buildDeepLink(token);
  const qr_png_data_url = await QRCode.toDataURL(qr_url, {
    errorCorrectionLevel: 'M',
    width: 512,
    margin: 2,
    color: {
      dark: '#0F1724',
      light: '#FFFFFF',
    },
  });

  return NextResponse.json({
    success: true,
    token,
    qr_url,
    qr_png_data_url,
    expires_at,
    operator_email,
    org_id,
  });
}
