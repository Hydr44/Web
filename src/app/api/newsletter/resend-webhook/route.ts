/**
 * POST /api/newsletter/resend-webhook
 * Sincronizza le disiscrizioni fatte dal link Resend (Broadcast) → Supabase.
 * Evento gestito: contact.unsubscribed (+ email.complained come igiene).
 *
 * Sicurezza: verifica la firma Svix (header svix-*) con RESEND_WEBHOOK_SECRET
 * (whsec_...). Se il secret non è configurato, accetta con un warning (utile in
 * fase di setup) — impostalo in produzione.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function verifySvix(secret: string, headers: Headers, payload: string): boolean {
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sigHeader = headers.get('svix-signature');
  if (!id || !ts || !sigHeader) return false;
  const key = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(key, 'base64');
  const signed = `${id}.${ts}.${payload}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signed).digest('base64');
  // svix-signature: "v1,<sig> v1,<sig2> ..." → confronto costante su almeno una.
  return sigHeader.split(' ').some((part) => {
    const sig = part.includes(',') ? part.split(',')[1] : part;
    try {
      return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    if (!verifySvix(secret, request.headers, raw)) {
      return NextResponse.json({ error: 'Firma non valida' }, { status: 401 });
    }
  } else {
    console.warn('[resend-webhook] RESEND_WEBHOOK_SECRET non configurato: verifica firma saltata');
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 });
  }

  const type = event?.type as string | undefined;
  if (type === 'contact.unsubscribed' || type === 'email.complained') {
    // contact.unsubscribed → data.email; email.complained → data.to (array/string)
    const emails: string[] = [];
    if (event?.data?.email) emails.push(String(event.data.email));
    const to = event?.data?.to;
    if (Array.isArray(to)) emails.push(...to.map(String));
    else if (typeof to === 'string') emails.push(to);

    for (const email of emails) {
      const e = email.trim().toLowerCase();
      if (!e) continue;
      await supabaseAdmin
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('email', e)
        .neq('status', 'unsubscribed');
    }
  }

  // Sempre 200: Resend ritenta solo su errore; non vogliamo loop su eventi ignorati.
  return NextResponse.json({ received: true });
}
