/**
 * POST /api/staff/auth/password/forgot   (pubblico)
 * Avvia il reset password inviando un OTP via email. Risposta SEMPRE generica
 * (nessuna email-enumeration): non rivela se l'account esiste.
 *
 * Body: { email }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { validateEmail, getClientIP, checkRateLimit, getRateLimitIdentifier } from '@/lib/security';
import { createAndSendOtp } from '@/lib/staff-flows';

const GENERIC = { success: true, message: 'Se l\'email è associata a un account staff, riceverai un codice per reimpostare la password.' };

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const ip = getClientIP(request);
  try {
    const { email } = await request.json();
    const clean = String(email || '').toLowerCase().trim();
    if (!validateEmail(clean).valid) {
      // Comunque risposta generica per non rivelare nulla
      return NextResponse.json(GENERIC, { headers });
    }

    // Rate-limit best-effort per-IP (difesa in profondità; il durevole è il
    // cooldown di reinvio OTP dentro createAndSendOtp).
    const rl = await checkRateLimit(getRateLimitIdentifier(request, 'combined', clean), 5, 15 * 60 * 1000);
    if (!rl.allowed) return NextResponse.json(GENERIC, { headers });

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, email, is_active, status')
      .eq('email', clean)
      .maybeSingle();

    if (staff && staff.is_active && staff.status !== 'suspended') {
      await createAndSendOtp({ id: staff.id, email: staff.email }, 'password_reset', ip).catch(() => {});
    }

    return NextResponse.json(GENERIC, { headers });
  } catch {
    return NextResponse.json(GENERIC, { headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
