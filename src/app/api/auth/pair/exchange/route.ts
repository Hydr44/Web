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
import { verifyPairingToken, type PairingPrefill } from '@/lib/pairing-jwt';
import { errors as joseErrors } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PairingClaim {
  jti: string;
  org_id: string;
  operator_email: string;
  driver_id?: string | null;
  staff_driver_id?: number | string | null;
  prefill?: PairingPrefill | null;
}

/**
 * Risolve il claim di pairing da un codice corto digitato sul mobile.
 * Cerca il record pairing_tokens ancora non usato con quel pair_code e verifica
 * che non sia scaduto. Ritorna il claim oppure un errore con relativo status.
 */
async function resolveClaimFromCode(
  code: string,
): Promise<{ claim: PairingClaim } | { error: string; status: number }> {
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length < 6) {
    return { error: 'invalid_token', status: 400 };
  }
  const { data: row, error } = await supabaseAdmin
    .from('pairing_tokens')
    .select('jti, org_id, operator_email, driver_id, staff_driver_id, prefill, expires_at')
    .eq('pair_code', normalized)
    .is('used_at', null)
    .maybeSingle();
  if (error) {
    console.error('[pair/exchange] code lookup failed:', error.message);
    return { error: 'internal', status: 500 };
  }
  if (!row) {
    // codice inesistente, già usato o digitato male
    return { error: 'invalid_token', status: 400 };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { error: 'expired', status: 400 };
  }
  return {
    claim: {
      jti: row.jti,
      org_id: row.org_id,
      operator_email: row.operator_email,
      driver_id: row.driver_id,
      staff_driver_id: row.staff_driver_id,
      prefill: (row.prefill ?? null) as PairingPrefill | null,
    },
  };
}

export async function POST(request: NextRequest) {
  // 1. Parse body: o `token` (JWT dal QR) o `code` (codice corto digitato).
  let token: string | undefined;
  let code: string | undefined;
  try {
    const body = await request.json();
    token = typeof body?.token === 'string' ? body.token : undefined;
    code = typeof body?.code === 'string' ? body.code : undefined;
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }
  if (!token && !code) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  // 2. Risolvi il "claim" del pairing dalla sorgente giusta:
  //    - via codice → lookup del record pairing_tokens ancora valido;
  //    - via QR → verifica firma JWT + exp + issuer.
  let payload: PairingClaim;
  if (code) {
    const resolved = await resolveClaimFromCode(code);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    payload = resolved.claim;
  } else {
    try {
      payload = (await verifyPairingToken(token as string)) as PairingClaim;
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
  }

  const { jti, org_id, operator_email, driver_id, staff_driver_id, prefill } = payload;
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
  //    Se l'admin ha già pre-creato l'account (provisioning autista), lo
  //    troviamo qui. Altrimenti lo creiamo on-the-fly (passwordless,
  //    finalizzato poi dal magic link).
  //
  // listUsers di Supabase non filtra per email lato server: dobbiamo
  // scansionare le pagine. Manteniamo perPage costante (1000) per evitare
  // off-by-one nella paginazione mista. Stop su prima match.
  const PER_PAGE = 1000;
  const MAX_PAGES = 10; // 10k utenti max — sufficiente per qualunque tenant
  const findUserByEmail = async (): Promise<{ id: string } | null> => {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
      if (error) {
        console.error('[pair/exchange] listUsers failed:', error.message);
        return null;
      }
      const users = data?.users ?? [];
      if (users.length === 0) return null;
      const found = users.find((u) => u.email?.toLowerCase() === operator_email);
      if (found) return { id: found.id };
      if (users.length < PER_PAGE) return null; // ultima pagina
    }
    return null;
  };

  let userId: string;
  {
    let found = await findUserByEmail();

    if (!found) {
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
        // Caso comune: email già esistente (utente provisionato prima ma non
        // trovato per qualche motivo). Riprova lookup — magari c'è una race.
        const isDuplicate = /already.*registered|already.*exists|duplicate/i.test(createErr?.message ?? '');
        if (isDuplicate) {
          found = await findUserByEmail();
        }
        if (!found) {
          console.error('[pair/exchange] auth.admin.createUser failed:', createErr?.message);
          return NextResponse.json({
            error: 'user_not_found',
            debug: process.env.NODE_ENV !== 'production' ? { createErr: createErr?.message } : undefined,
          }, { status: 404 });
        }
      } else {
        found = { id: created.user.id };
      }
    }

    userId = found.id;
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

  // Link staff_drivers ↔ auth.users + attiva mobile_status. Questo permette
  // al mobile di risalire da auth.uid() alla riga staff_drivers e leggere
  // mobile_modules. Non bloccante: se la colonna non esiste (env legacy
  // pre-migration 20260527) loggiamo e proseguiamo.
  if (staff_driver_id) {
    try {
      await supabaseAdmin
        .from('staff_drivers')
        .update({ auth_user_id: userId, mobile_status: 'active' })
        .eq('id', staff_driver_id);
    } catch (e) {
      console.warn('[pair/exchange] staff_drivers link failed:', (e as Error).message);
    }

    // Membership org_members 'autista' (fonte unica d'accesso): l'autista deve
    // esserne membro per la RLS (lettura trasporti). Solo se assente → niente
    // downgrade di eventuali ruoli staff.
    if (org_id) {
      try {
        const { data: mem } = await supabaseAdmin
          .from('org_members').select('user_id')
          .eq('org_id', org_id).eq('user_id', userId).maybeSingle();
        if (!mem) {
          await supabaseAdmin.from('org_members').insert({ org_id, user_id: userId, role: 'autista' });
        }
      } catch (e) {
        console.warn('[pair/exchange] org_members insert (autista) failed:', (e as Error).message);
      }
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
