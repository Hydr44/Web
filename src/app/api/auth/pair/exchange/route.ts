/**
 * POST /api/auth/pair/exchange
 *
 * Chiamato dal MOBILE (RescueMobile) dopo aver decodificato il QR.
 * Verifica firma JWT + scadenza + single-use → genera un magic link Supabase
 * → ritorna `token_hash` + `type` che il mobile consuma con
 * `supabase.auth.verifyOtp({ token_hash, type })` per stabilire la sessione.
 *
 * Auth: PUBLIC (l'operatore non è autenticato ancora).
 *
 * Body:
 *   { token: string }   // JWT generato da /pair/generate
 *
 * Response 200:
 *   {
 *     token_hash: string,   // hashed_token dal magic link
 *     type: 'magiclink',
 *     user_id: string,
 *     prefill: { org_id, name, phone, license_no, license_expiry, email }
 *   }
 *
 * Errors:
 *   400 invalid_token  — JWT corrotto o firma non valida
 *   400 expired        — JWT scaduto
 *   400 already_used   — jti già consumato (replay)
 *   404 user_not_found — operator_email non trovato (e auto-create fallisce)
 *   500 internal       — fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyPairingToken } from '@/lib/pairing-jwt';
import { errors as joseErrors } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Parse body
  let token: string | undefined;
  try {
    const body = await request.json();
    token = typeof body?.token === 'string' ? body.token : undefined;
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  // 2. Verifica JWT (firma + exp + issuer)
  let payload;
  try {
    payload = await verifyPairingToken(token);
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) {
      return NextResponse.json({ error: 'expired' }, { status: 400 });
    }
    if (
      e instanceof joseErrors.JWSSignatureVerificationFailed ||
      e instanceof joseErrors.JWTClaimValidationFailed ||
      e instanceof joseErrors.JWTInvalid
    ) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
    }
    console.error('[pair/exchange] verify unknown error:', (e as Error).message);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }

  const { jti, org_id, operator_email, driver_id, prefill } = payload;
  if (!jti || !org_id || !operator_email) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  // 3. Single-use: marca jti consumato atomicamente.
  //    Update con guard `used_at is null` → se affected_rows = 0 era già usato.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const ua = request.headers.get('user-agent') || '';

  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('pairing_tokens')
    .update({
      used_at: new Date().toISOString(),
      used_by_ip: ip,
      used_by_user_agent: ua,
    })
    .eq('jti', jti)
    .is('used_at', null)
    .select('jti')
    .maybeSingle();

  if (claimErr) {
    console.error('[pair/exchange] claim failed:', claimErr.message);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
  if (!claimed) {
    // jti già consumato o non esiste
    return NextResponse.json({ error: 'already_used' }, { status: 400 });
  }

  // 4. Trova o auto-crea l'utente in Supabase Auth.
  //    Se l'admin ha già pre-creato l'account con `force_password_change`, lo
  //    troviamo qui. Altrimenti lo creiamo on-the-fly (passwordless, sarà
  //    finalizzato dal magic link).
  let userId: string;
  {
    // Cerca user via getUserByEmail (admin endpoint)
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    // listUsers non filtra per email — workaround: usa filter su email match
    // tramite admin.getUserById se abbiamo l'id, altrimenti list+find.
    // Usiamo invece il listUsers con un email filter quando supportato (PG14+
    // su Supabase 2.x). Fallback: scansione locale.
    let user = existing?.users?.find((u) => u.email?.toLowerCase() === operator_email);

    if (!user) {
      // Scansione completa (pageNumber > 1) — improbabile su tenant piccoli
      // ma da fare per correttezza. Limitato a 5 pagine = 1500 utenti.
      for (let page = 2; page <= 5 && !user; page++) {
        const { data: p } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 300 });
        if (!p?.users?.length) break;
        user = p.users.find((u) => u.email?.toLowerCase() === operator_email);
      }
    }

    if (!user) {
      // Auto-crea utente passwordless
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: operator_email,
        email_confirm: true,
        user_metadata: {
          source: 'pairing',
          org_id,
          ...(prefill ?? {}),
        },
      });
      if (createErr || !created.user) {
        console.error('[pair/exchange] auth.admin.createUser failed:', createErr?.message);
        return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
      }
      userId = created.user.id;
    } else {
      userId = user.id;
    }
  }

  // 5. Genera magic link e tira fuori il `hashed_token` da passare al mobile.
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: operator_email,
  });

  if (linkErr || !linkData?.properties) {
    console.error('[pair/exchange] generateLink failed:', linkErr?.message);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }

  const hashedToken = linkData.properties.hashed_token;
  if (!hashedToken) {
    console.error('[pair/exchange] magic link missing hashed_token');
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }

  // 6. Pre-fill profiles + drivers (best effort, non bloccante).
  //    profiles.org_id obbligatoria perché AppBootstrap blocca senza.
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, org_id, full_name: prefill?.name ?? null });
  } catch (e) {
    console.warn('[pair/exchange] profiles upsert failed:', (e as Error).message);
  }

  if (prefill?.name || prefill?.phone || prefill?.license_no || prefill?.license_expiry) {
    try {
      await supabaseAdmin
        .from('drivers')
        .upsert(
          {
            auth_user_id: userId,
            org_id,
            name: prefill?.name ?? null,
            phone: prefill?.phone ?? null,
            license_no: prefill?.license_no ?? null,
            license_expiry: prefill?.license_expiry ?? null,
          },
          { onConflict: 'auth_user_id' },
        );
    } catch (e) {
      console.warn('[pair/exchange] drivers upsert failed:', (e as Error).message);
    }
  }

  return NextResponse.json({
    token_hash: hashedToken,
    type: 'magiclink',
    user_id: userId,
    prefill: {
      org_id,
      email: operator_email,
      ...(prefill ?? {}),
    },
  });
}
