/**
 * POST /api/staff/admin/staff/invite   (solo super_admin)
 * Crea un invito staff: riga staff `invited` (password_hash NULL) + record in
 * staff_invites (token hashato, TTL 48h) + email con link per verificare email
 * e impostare la password. Non imposta MAI la password lato admin.
 *
 * Body: { email, role, full_name? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { validateEmail } from '@/lib/security';
import { createAuditLog } from '@/lib/staff-audit';
import {
  randomToken, sha256, sendInviteEmail, INVITE_TTL_MS, VALID_STAFF_ROLES,
} from '@/lib/staff-flows';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Solo un super_admin può invitare staff' }, { status: 403, headers });
  }

  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    const role = String(body.role || body.staff_role || '').trim();
    const full_name = String(body.full_name || '').trim();

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.errors[0] }, { status: 400, headers });
    }
    if (!VALID_STAFF_ROLES.includes(role as any)) {
      return NextResponse.json({ success: false, error: `Ruolo non valido. Ammessi: ${VALID_STAFF_ROLES.join(', ')}` }, { status: 400, headers });
    }

    // Staff già esistente?
    const { data: existing } = await supabaseAdmin
      .from('staff')
      .select('id, status, email_verified_at, password_hash')
      .eq('email', email)
      .maybeSingle();

    let staffId: string;
    if (existing) {
      // Account già attivo/con password → non si re-invita (usa reset password)
      if (existing.password_hash || existing.status === 'active') {
        return NextResponse.json({ success: false, error: 'Esiste già un account staff attivo con questa email' }, { status: 409, headers });
      }
      // Account 'invited' pendente → si reinvita (aggiorna ruolo/nome)
      staffId = existing.id;
      await supabaseAdmin.from('staff')
        .update({ role, full_name: full_name || undefined, status: 'invited', invited_by: staff.sub, updated_at: new Date().toISOString() })
        .eq('id', staffId);
    } else {
      const { data: created, error: insErr } = await supabaseAdmin
        .from('staff')
        .insert({ email, password_hash: null, full_name, role, status: 'invited', is_active: true, invited_by: staff.sub })
        .select('id')
        .single();
      if (insErr || !created) {
        // 23505 = unique_violation (email già presente, es. richiesta concorrente)
        if ((insErr as any)?.code === '23505') {
          return NextResponse.json({ success: false, error: 'Esiste già un account staff con questa email' }, { status: 409, headers });
        }
        return NextResponse.json({ success: false, error: `Errore creazione staff: ${insErr?.message || 'sconosciuto'}` }, { status: 500, headers });
      }
      staffId = created.id;
    }

    // Revoca eventuali inviti pending per questa email (partial-unique le vieta duplicati)
    await supabaseAdmin.from('staff_invites').update({ status: 'revoked' }).eq('email', email).eq('status', 'pending');

    // Nuovo invito
    const rawToken = randomToken();
    const { data: invite, error: invErr } = await supabaseAdmin
      .from('staff_invites')
      .insert({
        email, role, full_name: full_name || null, invited_by: staff.sub,
        token_hash: sha256(rawToken), status: 'pending',
        expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
      })
      .select('id')
      .single();
    if (invErr || !invite) {
      return NextResponse.json({ success: false, error: `Errore creazione invito: ${invErr?.message || 'sconosciuto'}` }, { status: 500, headers });
    }

    // Email (best-effort: registra esito su email_sent_at/email_error)
    const sent = await sendInviteEmail(email, rawToken, role).catch(() => false);
    await supabaseAdmin.from('staff_invites')
      .update(sent ? { email_sent_at: new Date().toISOString() } : { email_error: 'invio fallito' })
      .eq('id', invite.id);

    await createAuditLog(staff.sub, staff.full_name, staff.role, 'staff.invite', 'staff_user', staffId, email, { role }, request, true);

    return NextResponse.json({
      success: true,
      message: sent ? 'Invito inviato' : 'Invito creato ma email non inviata (controlla la configurazione email)',
      invite_id: invite.id,
      email_sent: sent,
    }, { headers });
  } catch (e: any) {
    console.error('[staff invite] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
