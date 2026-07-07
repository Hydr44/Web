/**
 * GET /api/staff/invite/verify?token=...   (pubblico, gated dal token)
 * Valida un token di invito e restituisce email + ruolo per la pagina di
 * accettazione. Marca 'expired' gli inviti scaduti.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { sha256 } from '@/lib/staff-flows';

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  try {
    const token = request.nextUrl.searchParams.get('token') || '';
    if (!token) return NextResponse.json({ success: false, valid: false, error: 'Token mancante' }, { status: 400, headers });

    const { data: invite } = await supabaseAdmin
      .from('staff_invites')
      .select('id, email, role, status, expires_at')
      .eq('token_hash', sha256(token))
      .maybeSingle();

    if (!invite || invite.status !== 'pending') {
      return NextResponse.json({ success: true, valid: false, error: 'Invito non valido o già usato' }, { headers });
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from('staff_invites').update({ status: 'expired' }).eq('id', invite.id);
      return NextResponse.json({ success: true, valid: false, error: 'Invito scaduto' }, { headers });
    }

    return NextResponse.json({ success: true, valid: true, email: invite.email, role: invite.role }, { headers });
  } catch (e: any) {
    console.error('[staff invite verify] error:', e);
    return NextResponse.json({ success: false, valid: false, error: 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
