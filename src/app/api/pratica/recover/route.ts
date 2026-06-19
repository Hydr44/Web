// Recupero stato pratica via OTP (F5). PUBLIC. Il cliente senza account inserisce
// l'email → troviamo la sua pratica → inviamo un codice OTP a quell'email. Poi
// /api/pratica/recover/verify controlla il codice e restituisce il link allo stato.
// Risposta SEMPRE generica (no email enumeration).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { checkRateLimit } from '@/lib/security';
import { sendCustomerEmail } from '@/lib/customer-email';
import { generateOtpCode, hashCode, maskEmail, OTP_TTL_MS } from '@/lib/otp';

export const runtime = 'nodejs';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

/** Trova il preventivo "pratica in corso" più recente per l'email (con public_uuid). */
export async function findQuoteByEmail(email: string): Promise<{ uuid: string; name: string | null } | null> {
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, name')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lead) return null;
  const { data: quote } = await supabaseAdmin
    .from('lead_quotes')
    .select('public_uuid')
    .eq('lead_id', lead.id)
    .not('public_uuid', 'is', null)
    .in('status', ['paid', 'pending_activation', 'activated', 'sent', 'viewed', 'accepted'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return quote?.public_uuid ? { uuid: quote.public_uuid as string, name: lead.name } : null;
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));

  let body: { email?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Body non valido' }, { status: 400, headers }); }
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Inserisci un indirizzo email valido.' }, { status: 400, headers });
  }

  const masked = maskEmail(email);

  // Rate limit: max 5 richieste / ora per email (risposta comunque generica).
  const rl = await checkRateLimit(`pratica-recover:${email}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ ok: true, email_masked: masked }, { headers });

  const match = await findQuoteByEmail(email);
  if (match) {
    const code = generateOtpCode();
    await supabaseAdmin.from('email_otp').delete().eq('quote_uuid', match.uuid).is('verified_at', null);
    const { error: insErr } = await supabaseAdmin.from('email_otp').insert({
      quote_uuid: match.uuid,
      email,
      code_hash: hashCode(code),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    });
    if (!insErr) {
      await sendCustomerEmail(
        email,
        'Il tuo codice per lo stato pratica — RescueManager',
        `Ciao {{nome}},\n\nUsa questo codice per accedere allo stato della tua pratica. Scade tra 10 minuti.\n\nSe non hai richiesto tu questo codice, ignora questa email.`,
        { nome: match.name || undefined, subtitle: 'Stato pratica', code },
      );
    }
  }

  // Sempre generico: non riveliamo se l'email/pratica esiste.
  return NextResponse.json({ ok: true, email_masked: masked }, { headers });
}
