/**
 * POST /api/staff/invite/accept   (pubblico, gated dal token invito)
 * Il nuovo staff verifica l'email (il possesso del token la prova) e imposta
 * LUI la propria password. L'account passa a status='active', email_verified_at
 * e password_set_at valorizzati. L'invito diventa 'accepted'.
 *
 * Body: { token, password }
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { validatePassword, getClientIP, logSecurityEvent } from '@/lib/security';
import { sha256 } from '@/lib/staff-flows';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const ip = getClientIP(request);
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ success: false, error: 'Token e password richiesti' }, { status: 400, headers });
    }

    const pw = validatePassword(String(password));
    if (!pw.valid) return NextResponse.json({ success: false, error: pw.errors[0] }, { status: 400, headers });

    const { data: invite } = await supabaseAdmin
      .from('staff_invites')
      .select('id, email, status, expires_at')
      .eq('token_hash', sha256(String(token)))
      .maybeSingle();

    if (!invite || invite.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Invito non valido o già usato' }, { status: 400, headers });
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from('staff_invites').update({ status: 'expired' }).eq('id', invite.id);
      return NextResponse.json({ success: false, error: 'Invito scaduto' }, { status: 400, headers });
    }

    const { data: staffRow } = await supabaseAdmin
      .from('staff')
      .select('id, email')
      .eq('email', invite.email)
      .maybeSingle();
    if (!staffRow) {
      return NextResponse.json({ success: false, error: 'Account non trovato' }, { status: 404, headers });
    }

    const nowIso = new Date().toISOString();

    // CAS atomico: la transizione pending->accepted la vince UNA sola richiesta.
    // Due accept concorrenti con lo stesso token: solo il primo aggiorna la riga
    // (WHERE status='pending'), l'altro ottiene 0 righe → niente doppio set password.
    const { data: claimed } = await supabaseAdmin
      .from('staff_invites')
      .update({ status: 'accepted', accepted_at: nowIso })
      .eq('id', invite.id)
      .eq('status', 'pending')
      .select('id');
    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ success: false, error: 'Invito non valido o già usato' }, { status: 400, headers });
    }

    const password_hash = await bcrypt.hash(String(password), 10);
    const { error: updErr } = await supabaseAdmin
      .from('staff')
      .update({
        password_hash,
        password_set_at: nowIso,
        email_verified_at: nowIso,
        status: 'active',
        is_active: true,
        updated_at: nowIso,
      })
      .eq('id', staffRow.id);
    if (updErr) {
      return NextResponse.json({ success: false, error: `Errore impostazione password: ${updErr.message}` }, { status: 500, headers });
    }

    await logSecurityEvent({
      type: 'staff_invite_accepted', user_id: staffRow.id, email: staffRow.email,
      ip_address: ip, user_agent: request.headers.get('user-agent') || '',
      metadata: { endpoint: 'staff_invite_accept' },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Account attivato. Ora puoi accedere.' }, { headers });
  } catch (e: any) {
    console.error('[staff invite accept] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
