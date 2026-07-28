/**
 * POST /api/invite/accept
 *
 * Accettazione invito team LATO SERVER (service role). Sostituisce il flusso
 * client `supabase.auth.signUp` della pagina /accept-invite, che:
 *   - faceva partire la mail di CONFERMA di Supabase (→ 500 "Error sending
 *     confirmation email" se l'SMTP non risponde) e generava una SECONDA email
 *     oltre a quella d'invito;
 *   - non riusciva a leggere `orgs` (RLS lato anon → "Org data: null").
 *
 * Qui creiamo l'utente GIÀ CONFERMATO con `admin.createUser({ email_confirm:true })`
 * → nessuna mail di conferma, nessuna dipendenza SMTP. Ruolo e org sono presi
 * dal record invito (server-side → niente escalation di privilegi dal client).
 *
 * Body: { token, fullName, password }
 * 200: { ok: true, email, existed?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function findUserIdByEmail(email: string): Promise<string | null> {
  const PER_PAGE = 1000;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) return null;
    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (users.length < PER_PAGE) return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: { token?: string; fullName?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const token = String(body?.token || '').trim();
  const fullName = String(body?.fullName || '').trim();
  const password = String(body?.password || '');
  if (!token) return NextResponse.json({ error: 'Link invito non valido' }, { status: 400 });
  if (!fullName) return NextResponse.json({ error: 'Inserisci il tuo nome completo' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'La password deve essere di almeno 8 caratteri' }, { status: 400 });

  // 1. Invito (admin → bypassa RLS)
  const { data: invite, error: invErr } = await supabaseAdmin
    .from('org_invites')
    .select('email, role, org_id, status, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (invErr || !invite) return NextResponse.json({ error: 'Invito non trovato' }, { status: 404 });
  if (invite.status !== 'pending') return NextResponse.json({ error: 'Invito già utilizzato' }, { status: 409 });
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Questo invito è scaduto' }, { status: 410 });
  }

  const email = String(invite.email).toLowerCase();
  const role = invite.role || 'operator';

  // 2. Crea l'utente GIÀ CONFERMATO (nessuna mail di conferma → niente SMTP).
  let userId: string | null = null;
  let existed = false;
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created?.user) {
    userId = created.user.id;
  } else {
    const isDup = /already.*registered|already.*exists|duplicate|email.*exists/i.test(createErr?.message ?? '');
    if (isDup) {
      existed = true;
      userId = await findUserIdByEmail(email);
      if (!userId) {
        return NextResponse.json({ error: 'Esiste già un account con questa email: effettua il login.' }, { status: 409 });
      }
    } else {
      console.error('[invite/accept] createUser failed:', createErr?.message);
      return NextResponse.json({ error: createErr?.message || 'Registrazione fallita' }, { status: 500 });
    }
  }

  // 3. profiles: nome + org corrente (best-effort)
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email, full_name: fullName, current_org: invite.org_id });
  } catch (e) {
    console.warn('[invite/accept] profiles upsert skipped:', (e as Error).message);
  }

  // 4. org_members col ruolo DELL'INVITO (server-side → no escalation)
  const { error: memErr } = await supabaseAdmin
    .from('org_members')
    .upsert({ user_id: userId, org_id: invite.org_id, role }, { onConflict: 'org_id,user_id' });
  if (memErr) {
    console.error('[invite/accept] org_members upsert:', memErr.message);
    return NextResponse.json({ error: 'Impossibile aggiungerti al team' }, { status: 500 });
  }

  // 5. invito → accettato
  await supabaseAdmin
    .from('org_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('token', token);

  return NextResponse.json({ ok: true, email, existed });
}
