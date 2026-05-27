/**
 * POST /api/auth/driver-account
 *
 * Crea o aggiorna l'account Supabase auth di un autista (staff_drivers) per
 * l'app mobile RescueMobile. Non usa pairing QR: l'amministratore imposta
 * direttamente email + password dalla pagina DriverDetail; l'autista riceve
 * le credenziali fuori banda (WhatsApp, email manuale, ecc.) e fa login
 * con email+password nell'app.
 *
 * Differenze rispetto a /api/auth/pair/exchange:
 *  - questo è chiamato dall'amministratore (Bearer di un membro dell'org),
 *    non dal mobile
 *  - imposta password esplicita (non magic link)
 *  - aggiorna staff_drivers.auth_user_id e mobile_status='active' in un solo
 *    passaggio
 *
 * Auth:
 *   Header: Authorization: Bearer <supabase access_token (admin/operatore)>
 *
 * Body (POST):
 *   {
 *     staff_driver_id: string,   // staff_drivers.id
 *     email: string,
 *     password: string           // min 8 caratteri
 *   }
 *
 * Body (DELETE):
 *   { staff_driver_id: string }
 *
 * Response 200:
 *   {
 *     success: true,
 *     auth_user_id: string,
 *     email: string,
 *     created: boolean   // true se nuovo utente, false se update password
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...(origin ? { Vary: 'Origin' } : {}),
  };
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders(req.headers.get('origin')) });
}

/** Bearer + caller membership su org del driver. */
async function authorize(request: NextRequest, staffDriverId: string) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';
  if (!token) return { error: 'Missing bearer token', status: 401 } as const;

  const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !userData?.user) return { error: 'Invalid session', status: 401 } as const;
  const callerId = userData.user.id;

  const { data: drv, error: drvErr } = await supabaseAdmin
    .from('staff_drivers')
    .select('id, org_id, auth_user_id, email')
    .eq('id', staffDriverId)
    .maybeSingle();
  if (drvErr || !drv) return { error: 'staff_driver non trovato', status: 404 } as const;

  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('role')
    .eq('user_id', callerId)
    .eq('org_id', drv.org_id)
    .maybeSingle();
  if (!membership) return { error: 'Non sei membro di questa organizzazione', status: 403 } as const;

  return { drv } as const;
}

/** Trova utente per email scansionando le pagine admin.listUsers. */
async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const PER_PAGE = 1000;
  const MAX_PAGES = 10;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) return null;
    const users = data?.users ?? [];
    if (users.length === 0) return null;
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return { id: found.id };
    if (users.length < PER_PAGE) return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  let body: { staff_driver_id?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400, headers: cors });
  }

  const staffDriverId = String(body.staff_driver_id || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!staffDriverId) {
    return NextResponse.json({ error: 'staff_driver_id mancante' }, { status: 400, headers: cors });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Email non valida' }, { status: 400, headers: cors });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password troppo corta (min 8 caratteri)' }, { status: 400, headers: cors });
  }

  const authz = await authorize(request, staffDriverId);
  if ('error' in authz) {
    return NextResponse.json({ error: authz.error }, { status: authz.status, headers: cors });
  }
  const { drv } = authz;

  // 1) Cerca l'utente per email. Se esiste e ha auth_user_id sul driver →
  // update password. Se esiste ma il driver non lo conosce → linka e update
  // password. Se non esiste → crea con email_confirm=true.
  let existing = await findUserByEmail(email);
  let created = false;

  if (existing) {
    // Update password (e metadati base)
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { source: 'driver-account', org_id: drv.org_id, staff_driver_id: staffDriverId },
    });
    if (updErr) {
      return NextResponse.json(
        { error: `Errore aggiornamento utente: ${updErr.message}` },
        { status: 500, headers: cors },
      );
    }
  } else {
    const { data: cr, error: crErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'driver-account', org_id: drv.org_id, staff_driver_id: staffDriverId },
    });
    if (crErr || !cr?.user) {
      // Race: qualcun altro ha creato l'utente nel frattempo
      const isDuplicate = /already.*registered|already.*exists|duplicate/i.test(crErr?.message ?? '');
      if (isDuplicate) {
        existing = await findUserByEmail(email);
      }
      if (!existing) {
        return NextResponse.json(
          { error: `Errore creazione utente: ${crErr?.message || 'unknown'}` },
          { status: 500, headers: cors },
        );
      }
    } else {
      existing = { id: cr.user.id };
      created = true;
    }
  }

  // 2) Pre-fill profiles + link staff_drivers
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: existing!.id, org_id: drv.org_id });
  } catch (e) {
    console.warn('[driver-account] profiles upsert failed:', (e as Error).message);
  }

  // Recupera mobile_account_created_at corrente: se non esiste lo settiamo
  // adesso (prima creazione); se esiste già lo preserviamo (rappresenta la
  // storia "questo autista ha già avuto un account").
  const { data: priorRow } = await supabaseAdmin
    .from('staff_drivers')
    .select('mobile_account_created_at')
    .eq('id', staffDriverId)
    .maybeSingle();
  const nowIso = new Date().toISOString();

  const { error: linkErr } = await supabaseAdmin
    .from('staff_drivers')
    .update({
      auth_user_id: existing!.id,
      email,
      mobile_status: 'active',
      mobile_account_created_at: priorRow?.mobile_account_created_at || nowIso,
      // riattivazione → azzera l'eventuale flag di precedente disattivazione
      mobile_account_disabled_at: null,
    })
    .eq('id', staffDriverId);
  if (linkErr) {
    return NextResponse.json(
      { error: `Errore link staff_drivers: ${linkErr.message}` },
      { status: 500, headers: cors },
    );
  }

  return NextResponse.json(
    {
      success: true,
      auth_user_id: existing!.id,
      email,
      created,
    },
    { headers: cors },
  );
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  let body: { staff_driver_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400, headers: cors });
  }
  const staffDriverId = String(body.staff_driver_id || '').trim();
  if (!staffDriverId) {
    return NextResponse.json({ error: 'staff_driver_id mancante' }, { status: 400, headers: cors });
  }

  const authz = await authorize(request, staffDriverId);
  if ('error' in authz) {
    return NextResponse.json({ error: authz.error }, { status: authz.status, headers: cors });
  }

  // Non cancelliamo l'auth.user (potrebbe essere riassegnato/riusato). Solo
  // unlink + mobile_status='inactive'. L'autista, se prova a loggare, ha
  // ancora credenziali valide ma il mobile non lo riconoscerà come driver
  // (no record staff_drivers per auth.uid()).
  // Manteniamo `mobile_account_created_at` (storia) e settiamo
  // `mobile_account_disabled_at = now()` così il desktop sa distinguere
  // "mai creato" da "creato e poi disattivato".
  const { error: updErr } = await supabaseAdmin
    .from('staff_drivers')
    .update({
      auth_user_id: null,
      mobile_status: 'inactive',
      last_seen_at: null,
      mobile_account_disabled_at: new Date().toISOString(),
    })
    .eq('id', staffDriverId);
  if (updErr) {
    return NextResponse.json(
      { error: `Errore disattivazione: ${updErr.message}` },
      { status: 500, headers: cors },
    );
  }

  return NextResponse.json({ success: true }, { headers: cors });
}
