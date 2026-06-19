// Verifica OTP recupero pratica (F5). PUBLIC. Trova la pratica dall'email, verifica
// il codice e — se corretto — restituisce il link allo stato pratica (+ cookie di
// sessione). Errori generici (no email enumeration).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { hashCode, randomSessionToken, OTP_MAX_ATTEMPTS, OTP_COOKIE_PREFIX, OTP_COOKIE_MAX_AGE } from '@/lib/otp';
import { findQuoteByEmail } from '../route';

export const runtime = 'nodejs';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));

  let body: { email?: string; code?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Body non valido' }, { status: 400, headers }); }
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'Email o codice non validi.' }, { status: 400, headers });
  }

  const match = await findQuoteByEmail(email);
  // Errore generico se non c'è una pratica (non riveliamo l'esistenza).
  if (!match) return NextResponse.json({ ok: false, error: 'Codice non valido o scaduto. Richiedine uno nuovo.' }, { status: 400, headers });

  const { data: otp } = await supabaseAdmin
    .from('email_otp')
    .select('id, code_hash, expires_at, attempts, verified_at')
    .eq('quote_uuid', match.uuid)
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

  // OK → segna verificato + cookie di sessione, restituisci il link allo stato.
  const sessionToken = randomSessionToken();
  await supabaseAdmin.from('email_otp')
    .update({ verified_at: new Date().toISOString(), session_token: sessionToken })
    .eq('id', otp.id);

  const res = NextResponse.json({ ok: true, uuid: match.uuid }, { headers });
  res.cookies.set(OTP_COOKIE_PREFIX + match.uuid, sessionToken, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: OTP_COOKIE_MAX_AGE,
  });
  return res;
}
