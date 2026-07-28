/**
 * POST /api/staff/auth/password/reset   (pubblico, gated dall'OTP)
 * Completa il reset: verifica l'OTP (purpose=password_reset), imposta la nuova
 * password, azzera lockout, REVOCA tutte le sessioni attive (logout globale).
 *
 * Body: { email, code, password }
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { validateEmail, validatePassword, getClientIP, logSecurityEvent } from '@/lib/security';
import { verifyOtp, sendPasswordChangedEmail } from '@/lib/staff-flows';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const ip = getClientIP(request);
  try {
    const { email, code, password } = await request.json();
    const clean = String(email || '').toLowerCase().trim();
    if (!validateEmail(clean).valid || !code || !password) {
      return NextResponse.json({ success: false, error: 'Email, codice e nuova password richiesti' }, { status: 400, headers });
    }
    const pw = validatePassword(String(password));
    if (!pw.valid) return NextResponse.json({ success: false, error: pw.errors[0] }, { status: 400, headers });

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, email, is_active, status')
      .eq('email', clean)
      .maybeSingle();

    // Risposta uniforme sull'esito OTP per non rivelare l'esistenza dell'account:
    // se lo staff non esiste, verifichiamo comunque contro un id impossibile.
    const staffId = staff?.id || '00000000-0000-0000-0000-000000000000';
    const res = await verifyOtp(staffId, 'password_reset', String(code));
    if (!res.ok || !staff || !staff.is_active || staff.status === 'suspended') {
      return NextResponse.json({ success: false, error: res.error || 'Codice non valido' }, { status: 400, headers });
    }

    const password_hash = await bcrypt.hash(String(password), 10);
    const nowIso = new Date().toISOString();
    await supabaseAdmin.from('staff').update({
      password_hash,
      password_set_at: nowIso,
      email_verified_at: nowIso,          // il reset via OTP email prova anche il possesso dell'email
      status: 'active',
      failed_login_count: 0,
      locked_until: null,
      updated_at: nowIso,
    }).eq('id', staff.id);

    // Logout globale: revoca tutte le sessioni attive
    await supabaseAdmin.from('staff_sessions').delete().eq('staff_id', staff.id);

    // Notifica di sicurezza (best-effort): avvisa del cambio password.
    await sendPasswordChangedEmail(staff.email).catch(() => {});

    await logSecurityEvent({
      type: 'password_reset', user_id: staff.id, email: staff.email, ip_address: ip,
      user_agent: request.headers.get('user-agent') || '',
      metadata: { endpoint: 'staff_password_reset' },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Password aggiornata. Ora puoi accedere.' }, { headers });
  } catch (e: any) {
    console.error('[staff password reset] error:', e);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
