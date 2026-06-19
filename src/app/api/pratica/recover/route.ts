// Recupera link pratica (F5). PUBLIC. Il cliente non ha un account/password: se ha
// perso il link, inserisce l'email e gli rimandiamo via email il link /pratica della
// sua pratica in corso. Risposta SEMPRE generica (niente email enumeration: non
// riveliamo se l'email esiste o ha una pratica).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { checkRateLimit } from '@/lib/security';
import { sendCustomerEmail } from '@/lib/customer-email';

export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));

  let body: { email?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Body non valido' }, { status: 400, headers }); }
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Inserisci un indirizzo email valido.' }, { status: 400, headers });
  }

  // Rate limit: max 5 richieste / ora per email.
  const rl = await checkRateLimit(`pratica-recover:${email}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true, generic: true }, { headers }); // risposta generica anche qui
  }

  // Cerca un preventivo con public_uuid del lead con questa email, in una pratica "in corso".
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, name, status')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lead) {
    const { data: quote } = await supabaseAdmin
      .from('lead_quotes')
      .select('public_uuid, status, created_at')
      .eq('lead_id', lead.id)
      .not('public_uuid', 'is', null)
      .in('status', ['paid', 'pending_activation', 'activated', 'sent', 'viewed', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quote?.public_uuid) {
      await sendCustomerEmail(
        email,
        'Il link della tua pratica — RescueManager',
        `Ciao {{nome}},\n\n` +
        `Ecco il link per controllare lo stato della tua pratica:\n` +
        `${SITE_URL}/pratica/${quote.public_uuid}\n\n` +
        `Conservalo per accedere allo stato in qualsiasi momento.\n\n` +
        `Se non hai richiesto tu questo messaggio, ignoralo.`,
        { nome: lead.name },
      );
    }
  }

  // Sempre generico: non riveliamo se l'email/pratica esiste.
  return NextResponse.json({ ok: true, generic: true }, { headers });
}
