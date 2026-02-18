import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateStaffToken } from '@/lib/staff-auth';
import { checkRateLimit, getRateLimitIdentifier, logSecurityEvent, validateEmail } from '@/lib/security';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
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
      .select('id, email, password_hash, full_name, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!staff.is_active) {
      return NextResponse.json(
        { success: false, error: 'Account disabilitato. Contatta un amministratore.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, staff.password_hash);
    if (!passwordValid) {
      // Log failed attempt
      await logSecurityEvent({
        type: 'login_failed',
        email: staff.email,
        ip_address: ip,
        user_agent: userAgent,
        metadata: { reason: 'invalid_password', endpoint: 'staff_login' },
      });

      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401, headers: corsHeaders }
      );
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
