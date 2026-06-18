// Invia OTP email (F5). PUBLIC, validata sul public_uuid. Genera un codice 6 cifre,
// lo salva (hash) e lo manda all'email del lead. Solo dopo il pagamento.
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

export async function POST(request: NextRequest, { params }: { params: { uuid: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const uuid = params.uuid;

  const { data: quote } = await supabaseAdmin
    .from('lead_quotes')
    .select('id, status, leads!lead_quotes_lead_id_fkey(status, email, name)')
    .eq('public_uuid', uuid)
    .maybeSingle();
  if (!quote) return NextResponse.json({ ok: false, error: 'Preventivo non trovato.' }, { status: 404, headers });

  const lead = (quote as Record<string, any>).leads || {};
  const paid = ['paid', 'pending_activation', 'activated'].includes(quote.status as string);
  if (!paid && lead.status !== 'in_verifica') {
    return NextResponse.json({ ok: false, error: 'Disponibile dopo il pagamento.' }, { status: 403, headers });
  }
  if (!lead.email) return NextResponse.json({ ok: false, error: 'Nessuna email associata.' }, { status: 400, headers });

  // Rate limit: max 5 invii / ora per preventivo.
  const rl = await checkRateLimit(`otp-send:${uuid}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Troppi invii. Riprova tra un po\'.' }, { status: 429, headers });
  }

  const code = generateOtpCode();
  // Pulisci eventuali OTP non verificati precedenti per questo preventivo.
  await supabaseAdmin.from('email_otp').delete().eq('quote_uuid', uuid).is('verified_at', null);
  const { error: insErr } = await supabaseAdmin.from('email_otp').insert({
    quote_uuid: uuid,
    email: lead.email,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });
  if (insErr) return NextResponse.json({ ok: false, error: 'Errore generazione codice.' }, { status: 500, headers });

  await sendCustomerEmail(
    lead.email,
    'Il tuo codice di verifica — RescueManager',
    `Ciao {{nome}},\n\nIl tuo codice di verifica è: ${code}\n\nInseriscilo nella pagina di configurazione per continuare. Scade tra 10 minuti.\n\nSe non hai richiesto tu questo codice, ignora questa email.`,
    { nome: lead.name },
  );

  return NextResponse.json({ ok: true, email_masked: maskEmail(lead.email) }, { headers });
}
