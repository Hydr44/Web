// Verifica OTP email (F5). PUBLIC, validata sul public_uuid. Confronta il codice,
// e in caso positivo segna verified_at + imposta un cookie di sessione (7gg) così
// alla RIPRESA non serve rifare l'OTP (sullo stesso dispositivo).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { hashCode, randomSessionToken, OTP_MAX_ATTEMPTS, OTP_COOKIE_PREFIX, OTP_COOKIE_MAX_AGE } from '@/lib/otp';

export const runtime = 'nodejs';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: NextRequest, { params }: { params: { uuid: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const uuid = params.uuid;

  let body: { code?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Body non valido' }, { status: 400, headers }); }
  const code = String(body.code || '').trim();
  if (!/^[0-9]{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'Codice non valido (6 cifre).' }, { status: 400, headers });
  }

  // OTP più recente non ancora verificato per questo preventivo.
  const { data: otp } = await supabaseAdmin
    .from('email_otp')
    .select('id, code_hash, expires_at, attempts, verified_at')
    .eq('quote_uuid', uuid)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) return NextResponse.json({ ok: false, error: 'Nessun codice attivo. Richiedine uno nuovo.' }, { status: 400, headers });
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: 'Codice scaduto. Richiedine uno nuovo.' }, { status: 400, headers });
  }
  if ((otp.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ ok: false, error: 'Troppi tentativi. Richiedi un nuovo codice.' }, { status: 429, headers });
  }

  if (hashCode(code) !== otp.code_hash) {
    await supabaseAdmin.from('email_otp').update({ attempts: (otp.attempts || 0) + 1 }).eq('id', otp.id);
    const left = OTP_MAX_ATTEMPTS - (otp.attempts || 0) - 1;
    return NextResponse.json({ ok: false, error: `Codice errato.${left > 0 ? ` Tentativi rimasti: ${left}.` : ''}` }, { status: 400, headers });
  }

  // OK → verifica + token sessione per la ripresa.
  const sessionToken = randomSessionToken();
  await supabaseAdmin.from('email_otp')
    .update({ verified_at: new Date().toISOString(), session_token: sessionToken })
    .eq('id', otp.id);

  const res = NextResponse.json({ ok: true }, { headers });
  res.cookies.set(OTP_COOKIE_PREFIX + uuid, sessionToken, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: OTP_COOKIE_MAX_AGE,
  });
  return res;
}
