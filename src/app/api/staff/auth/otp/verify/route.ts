/**
 * POST /api/staff/auth/otp/verify   (pubblico, gated dal ticket OTP)
 * Secondo fattore del login: richiede il `otp_ticket` (prova che lo step
 * password è passato) + il codice ricevuto via email. Al successo emette il
 * JWT staff, crea la sessione e marca il dispositivo come fidato (cookie 7gg).
 *
 * Body: { otp_ticket, code, remember_device? (default true) }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateStaffToken } from '@/lib/staff-auth';
import { getClientIP, logSecurityEvent } from '@/lib/security';
import {
  verifyOtpTicket, verifyOtp, issueTrustedDevice, sha256,
  DEVICE_COOKIE, DEVICE_TTL_DAYS, LOGIN_LOCK_THRESHOLD, LOGIN_LOCK_MS,
} from '@/lib/staff-flows';

function getCorsHeaders(origin: string | null) {
  const allowed = [
    'https://rescuemanager.eu', 'https://www.rescuemanager.eu', 'https://staging.rescuemanager.eu',
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000',
  ];
  const ok = (origin && allowed.includes(origin)) || origin?.startsWith('app://') || origin?.startsWith('http://localhost:');
  return {
    'Access-Control-Allow-Origin': ok && origin ? origin : 'https://rescuemanager.eu',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || '';

  try {
    const { otp_ticket, code, remember_device = true } = await req.json();
    if (!otp_ticket || !code) {
      return NextResponse.json({ success: false, error: 'Ticket e codice richiesti' }, { status: 400, headers });
    }

    const staffId = await verifyOtpTicket(String(otp_ticket));
    if (!staffId) {
      return NextResponse.json({ success: false, error: 'Sessione OTP scaduta. Rifai il login.' }, { status: 401, headers });
    }

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, email, full_name, role, is_active, status, failed_login_count, locked_until')
      .eq('id', staffId)
      .single();
    if (!staff || !staff.is_active || staff.status === 'suspended') {
      return NextResponse.json({ success: false, error: 'Account non disponibile' }, { status: 403, headers });
    }
    // Lockout durevole anche in fase OTP (il contatore fallimenti è condiviso col login).
    if (staff.locked_until && new Date(staff.locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(staff.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json({ success: false, error: `Account temporaneamente bloccato. Riprova tra ${mins} minuti.` }, { status: 429, headers });
    }

    const res = await verifyOtp(staffId, 'login', String(code));
    if (!res.ok) {
      // Fallimento OTP → incrementa il contatore; oltre soglia lock temporaneo.
      const nextCount = (staff.failed_login_count || 0) + 1;
      const lock = nextCount >= LOGIN_LOCK_THRESHOLD;
      await supabaseAdmin.from('staff').update(
        lock
          ? { failed_login_count: 0, locked_until: new Date(Date.now() + LOGIN_LOCK_MS).toISOString() }
          : { failed_login_count: nextCount },
      ).eq('id', staff.id);
      await logSecurityEvent({
        type: 'login_failed', user_id: staffId, ip_address: ip, user_agent: userAgent,
        metadata: { endpoint: 'staff_otp_verify', reason: res.error, locked: lock },
      }).catch(() => {});
      return NextResponse.json({ success: false, error: res.error }, { status: 401, headers });
    }

    const token = await generateStaffToken({ sub: staff.id, email: staff.email, role: staff.role, full_name: staff.full_name });

    const nowIso = new Date().toISOString();
    // OTP ok → azzera i contatori di fallimento.
    await supabaseAdmin.from('staff').update({
      last_login_at: nowIso, last_login_ip: ip, failed_login_count: 0, locked_until: null,
    }).eq('id', staff.id);
    await supabaseAdmin.from('staff_sessions').insert({
      staff_id: staff.id, token_hash: sha256(token), ip_address: ip, user_agent: userAgent,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });

    await logSecurityEvent({
      type: 'login_success', user_id: staff.id, email: staff.email, ip_address: ip, user_agent: userAgent,
      metadata: { role: staff.role, endpoint: 'staff_otp_verify', step: 'otp_ok' },
    }).catch(() => {});

    // Device token: lo restituiamo ANCHE nel JSON (per Electron, cross-site, che
    // non riceve il cookie sameSite=strict) oltre a settarlo come cookie httpOnly.
    let deviceToken: string | null = null;
    if (remember_device) deviceToken = await issueTrustedDevice(staff.id, ip, userAgent);

    const response = NextResponse.json({
      success: true, token,
      staff: { id: staff.id, email: staff.email, full_name: staff.full_name, role: staff.role },
      device_token: deviceToken,
    }, { headers });

    if (deviceToken) {
      response.cookies.set(DEVICE_COOKIE, deviceToken, {
        httpOnly: true, secure: true, sameSite: 'strict', path: '/',
        maxAge: DEVICE_TTL_DAYS * 24 * 3600,
      });
    }
    return response;
  } catch (e: any) {
    console.error('[staff otp verify] error:', e);
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers });
  }
}
