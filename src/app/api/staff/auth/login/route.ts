import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateStaffToken } from '@/lib/staff-auth';
import { checkRateLimit, getRateLimitIdentifier, logSecurityEvent, validateEmail } from '@/lib/security';
import { maskEmail } from '@/lib/otp';
import {
  STAFF_OTP_ENABLED, isTrustedDevice, createAndSendOtp, issueOtpTicket,
  DEVICE_COOKIE, LOGIN_LOCK_THRESHOLD, LOGIN_LOCK_MS,
} from '@/lib/staff-flows';

function getCorsHeaders(origin: string | null) {
  // Admin panel ora e' Electron desktop (origin `app://` in prod). Sottodominio
  // admin.rescuemanager.eu dismesso a maggio 2026.
  const allowedOrigins = [
    'https://rescuemanager.eu',
    'https://www.rescuemanager.eu',
    'https://staging.rescuemanager.eu',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
  ];

  const isAllowed = (origin && allowedOrigins.includes(origin)) ||
    origin?.startsWith('app://') ||
    origin?.startsWith('http://localhost:');
  const corsOrigin = isAllowed && origin ? origin : 'https://rescuemanager.eu';
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e password sono obbligatori' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: emailValidation.errors[0] },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limiting - max 5 tentativi per IP in 15 minuti
    const rateLimitId = getRateLimitIdentifier(req, 'combined', email);
    const rateLimit = await checkRateLimit(rateLimitId, 5, 15 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      const minutesRemaining = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
      
      await logSecurityEvent({
        type: 'rate_limit_exceeded',
        email,
        ip_address: ip,
        user_agent: userAgent,
        metadata: { endpoint: 'staff_login', remaining_minutes: minutesRemaining },
      });

      return NextResponse.json(
        { success: false, error: `Troppi tentativi. Riprova tra ${minutesRemaining} minuti.` },
        { status: 429, headers: corsHeaders }
      );
    }

    // Find staff by email
    const { data: staff, error } = await supabaseAdmin
      .from('staff')
      .select('id, email, password_hash, full_name, role, is_active, status, failed_login_count, locked_until')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!staff.is_active || staff.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'Account disabilitato. Contatta un amministratore.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Lockout durevole (a DB): dopo troppi tentativi falliti l'account è bloccato
    // per LOGIN_LOCK_MS a prescindere dal rate-limit per-IP (best-effort su serverless).
    if (staff.locked_until && new Date(staff.locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(staff.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { success: false, error: `Account temporaneamente bloccato. Riprova tra ${mins} minuti.` },
        { status: 429, headers: corsHeaders }
      );
    }

    // Account invitato ma senza password ancora impostata (o disattivo):
    // non facciamo bcrypt.compare su null.
    if (!staff.password_hash) {
      return NextResponse.json(
        { success: false, error: staff.status === 'invited' ? 'Completa prima l\'invito ricevuto via email.' : 'Credenziali non valide' },
        { status: staff.status === 'invited' ? 403 : 401, headers: corsHeaders }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, staff.password_hash);
    if (!passwordValid) {
      // Incrementa il contatore fallimenti; oltre soglia → lock temporaneo.
      const nextCount = (staff.failed_login_count || 0) + 1;
      const lock = nextCount >= LOGIN_LOCK_THRESHOLD;
      await supabaseAdmin.from('staff').update(
        lock
          ? { failed_login_count: 0, locked_until: new Date(Date.now() + LOGIN_LOCK_MS).toISOString() }
          : { failed_login_count: nextCount },
      ).eq('id', staff.id);

      await logSecurityEvent({
        type: 'login_failed',
        email: staff.email,
        ip_address: ip,
        user_agent: userAgent,
        metadata: { reason: 'invalid_password', endpoint: 'staff_login', locked: lock },
      });

      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Password corretta → azzera i contatori di fallimento.
    if (staff.failed_login_count || staff.locked_until) {
      await supabaseAdmin.from('staff').update({ failed_login_count: 0, locked_until: null }).eq('id', staff.id);
    }

    // ── Step-up OTP (dietro flag): se il dispositivo NON è fidato, non emettiamo
    //    subito il token: mandiamo un OTP via email e restituiamo un "ticket".
    //    Con STAFF_OTP_ENABLED=false il comportamento è identico a prima. ──────
    if (STAFF_OTP_ENABLED) {
      const deviceToken = req.cookies.get(DEVICE_COOKIE)?.value;
      const trusted = await isTrustedDevice(staff.id, deviceToken);
      if (!trusted) {
        await createAndSendOtp({ id: staff.id, email: staff.email }, 'login', ip);
        const otpTicket = await issueOtpTicket(staff.id);
        await logSecurityEvent({
          type: 'login_success', user_id: staff.id, email: staff.email,
          ip_address: ip, user_agent: userAgent,
          metadata: { role: staff.role, endpoint: 'staff_login', step: 'otp_required' },
        });
        return NextResponse.json({
          success: true,
          otp_required: true,
          otp_ticket: otpTicket,
          email: maskEmail(staff.email),
        }, { headers: corsHeaders });
      }
    }

    // Generate JWT
    const token = await generateStaffToken({
      sub: staff.id,
      email: staff.email,
      role: staff.role,
      full_name: staff.full_name,
    });

    // Log successful login
    await logSecurityEvent({
      type: 'login_success',
      user_id: staff.id,
      email: staff.email,
      ip_address: ip,
      user_agent: userAgent,
      metadata: { role: staff.role, endpoint: 'staff_login' },
    });

    // Update last login
    await supabaseAdmin
      .from('staff')
      .update({ last_login_at: new Date().toISOString(), last_login_ip: ip })
      .eq('id', staff.id);

    // Store session (SHA-256 hash of token for revocation)
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from('staff_sessions').insert({
      staff_id: staff.id,
      token_hash: tokenHash,
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || '',
      expires_at: expiresAt,
    });

    return NextResponse.json({
      success: true,
      token,
      staff: {
        id: staff.id,
        email: staff.email,
        full_name: staff.full_name,
        role: staff.role,
      },
    }, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Staff login error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
