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
  DEVICE_COOKIE, DEVICE_TTL_DAYS,
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

    const res = await verifyOtp(staffId, 'login', String(code));
    if (!res.ok) {
      await logSecurityEvent({
        type: 'login_failed', user_id: staffId, ip_address: ip, user_agent: userAgent,
        metadata: { endpoint: 'staff_otp_verify', reason: res.error },
      }).catch(() => {});
      return NextResponse.json({ success: false, error: res.error }, { status: 401, headers });
    }

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, email, full_name, role, is_active, status')
      .eq('id', staffId)
      .single();
    if (!staff || !staff.is_active || staff.status === 'suspended') {
      return NextResponse.json({ success: false, error: 'Account non disponibile' }, { status: 403, headers });
    }

    const token = await generateStaffToken({ sub: staff.id, email: staff.email, role: staff.role, full_name: staff.full_name });

    const nowIso = new Date().toISOString();
    await supabaseAdmin.from('staff').update({ last_login_at: nowIso, last_login_ip: ip }).eq('id', staff.id);
    await supabaseAdmin.from('staff_sessions').insert({
      staff_id: staff.id, token_hash: sha256(token), ip_address: ip, user_agent: userAgent,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });

    await logSecurityEvent({
      type: 'login_success', user_id: staff.id, email: staff.email, ip_address: ip, user_agent: userAgent,
      metadata: { role: staff.role, endpoint: 'staff_otp_verify', step: 'otp_ok' },
    }).catch(() => {});

    const response = NextResponse.json({
      success: true, token,
      staff: { id: staff.id, email: staff.email, full_name: staff.full_name, role: staff.role },
    }, { headers });

    if (remember_device) {
      const deviceToken = await issueTrustedDevice(staff.id, ip, userAgent);
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
