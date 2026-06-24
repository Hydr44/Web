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
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendCustomerEmail } from '@/lib/customer-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu';

/** Crea l'account autista e invia un'email per impostare la password (come il Team). */
async function sendDriverInvite(email: string, name: string | null): Promise<void> {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${SITE_URL}/set-password` },
  });
  const link = data?.properties?.action_link;
  if (error || !link) return; // best-effort
  await sendCustomerEmail(
    email,
    'Accesso all\'app RescueManager — imposta la password',
    `Ciao {{nome}},\n\nLa tua azienda ti ha abilitato all'app RescueManager per autisti.\n\nImposta la tua password dal pulsante qui sotto, poi accedi all'app con la tua email e la password che hai scelto.`,
    { nome: name || undefined, subtitle: 'Accesso autista', cta: { href: link, label: 'Imposta la password' } },
  );
}

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

  // A5 — Solo il titolare (owner) o un admin dell'org possono creare account o
  // resettare la password di un autista. Senza questo check, un member/autista
  // poteva reset password e accedere all'account di un collega.
  // NB: org_members.role usa owner/admin/member/autista (NON 'dispatcher', che
  // appartiene a profiles.ruolo) → l'allowlist deve includere 'owner'.
  const role = String(membership.role || '').toLowerCase();
  if (!['owner', 'admin'].includes(role)) {
    return { error: 'Operazione riservata al titolare o agli admin.', status: 403 } as const;
  }

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

  let body: { staff_driver_id?: string; email?: string; password?: string; mode?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400, headers: cors });
  }

  const staffDriverId = String(body.staff_driver_id || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  // mode 'invite' (consigliato): l'autista riceve un'email e imposta LUI la password
  // (come il Team). mode 'password' (legacy): l'admin imposta la password a mano.
  const mode = body.mode === 'invite' ? 'invite' : 'password';
  // In modalità invito non serve password: l'utente viene creato con una password
  // casuale e poi la imposta dal link email.
  const password = mode === 'invite' ? crypto.randomBytes(24).toString('hex') : String(body.password || '');

  if (!staffDriverId) {
    return NextResponse.json({ error: 'staff_driver_id mancante' }, { status: 400, headers: cors });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Email non valida' }, { status: 400, headers: cors });
  }
  if (mode === 'password' && password.length < 8) {
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
    // ANTI furto-account: se questa email/auth user è già usata da un ALTRO autista
    // o da un membro dello staff (admin/operatore), NON resettare la sua password e
    // NON rubarla all'autista. Si linka solo se libera o già di QUESTO autista.
    const [{ data: otherDriver }, { data: orgMember }] = await Promise.all([
      supabaseAdmin.from('staff_drivers').select('id').eq('auth_user_id', existing.id).neq('id', staffDriverId).maybeSingle(),
      supabaseAdmin.from('org_members').select('user_id, role').eq('user_id', existing.id).maybeSingle(),
    ]);
    // Anti furto-account: blocca se l'email è di un MEMBRO STAFF (ruolo != autista)
    // o di un ALTRO autista. Una membership 'autista' appartiene all'autista stesso
    // (ri-provisioning del suo account) → consentita.
    const isStaffMember = !!orgMember && orgMember.role !== 'autista';
    if (otherDriver || isStaffMember) {
      return NextResponse.json(
        { error: 'Questa email è già associata a un altro account (membro del team o altro autista). Usa un\'email diversa per l\'autista.' },
        { status: 409, headers: cors },
      );
    }
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

  // 3) Membership org_members con ruolo 'autista' (fonte unica d'accesso). Con la
  // RLS unificata su org_members, l'autista DEVE esserne membro per leggere i
  // trasporti dell'org. Inseriamo solo se assente: non sovrascriviamo mai un
  // eventuale ruolo staff (no downgrade).
  const { data: existingMem } = await supabaseAdmin
    .from('org_members').select('user_id')
    .eq('org_id', drv.org_id).eq('user_id', existing!.id).maybeSingle();
  if (!existingMem) {
    const { error: memErr } = await supabaseAdmin
      .from('org_members').insert({ org_id: drv.org_id, user_id: existing!.id, role: 'autista' });
    if (memErr) console.warn('[driver-account] org_members insert (autista) failed:', memErr.message);
  }

  // Modalità invito: manda l'email per far impostare la password all'autista.
  if (mode === 'invite') {
    await sendDriverInvite(email, String(body.name || '').trim() || null);
  }

  return NextResponse.json(
    {
      success: true,
      auth_user_id: existing!.id,
      email,
      created,
      invited: mode === 'invite',
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
