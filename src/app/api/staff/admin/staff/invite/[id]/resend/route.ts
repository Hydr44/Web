/**
 * POST /api/staff/admin/staff/invite/:id/resend   (solo super_admin)
 * Rigenera il token di un invito (pending) ed estende la scadenza, poi
 * reinvia l'email. Non tocca l'account staff collegato.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { createAuditLog } from '@/lib/staff-audit';
import { randomToken, sha256, sendInviteEmail, INVITE_TTL_MS } from '@/lib/staff-flows';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Solo un super_admin può reinviare inviti' }, { status: 403, headers });
  }

  try {
    const { data: invite } = await supabaseAdmin
      .from('staff_invites')
      .select('id, email, role, status')
      .eq('id', params.id)
      .maybeSingle();

    if (!invite) return NextResponse.json({ success: false, error: 'Invito non trovato' }, { status: 404, headers });
    // Solo pending o expired si reinviano. Un invito REVOCATO non si rianima
    // (l'admin l'ha annullato apposta); uno ACCEPTED è già stato usato.
    if (invite.status !== 'pending' && invite.status !== 'expired') {
      const msg = invite.status === 'accepted' ? 'Invito già accettato' : 'Invito revocato: creane uno nuovo';
      return NextResponse.json({ success: false, error: msg }, { status: 409, headers });
    }

    const rawToken = randomToken();
    await supabaseAdmin.from('staff_invites')
      .update({
        token_hash: sha256(rawToken),
        status: 'pending',
        expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
        email_error: null,
      })
      .eq('id', invite.id);

    const sent = await sendInviteEmail(invite.email, rawToken, invite.role).catch(() => false);
    await supabaseAdmin.from('staff_invites')
      .update(sent ? { email_sent_at: new Date().toISOString() } : { email_error: 'invio fallito' })
      .eq('id', invite.id);

    await createAuditLog(staff.sub, staff.full_name, staff.role, 'staff.invite_resend', 'staff_user', invite.id, invite.email, {}, request, true);

    return NextResponse.json({ success: true, message: sent ? 'Invito reinviato' : 'Invito rigenerato ma email non inviata', email_sent: sent }, { headers });
  } catch (e: any) {
    console.error('[staff invite resend] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
