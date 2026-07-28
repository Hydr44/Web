/**
 * POST /api/newsletter/subscribe
 * Iscrizione newsletter con DOUBLE OPT-IN: salva il contatto in stato 'pending'
 * e invia l'email di conferma. La conferma (GET /confirm) lo sincronizza
 * sull'Audience Resend.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { newToken, isValidEmail, sendEmail, confirmEmailHtml } from '@/lib/newsletter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const consent = body.consent === true;
    const source = typeof body.source === 'string' ? body.source : 'footer';

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Indirizzo email non valido.' }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ success: false, error: 'Devi accettare il trattamento dei dati.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;
    const origin = new URL(request.url).origin;
    const now = new Date().toISOString();

    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status, confirm_token')
      .eq('email', email)
      .maybeSingle();

    // Già confermato → niente da fare.
    if (existing?.status === 'confirmed') {
      return NextResponse.json({ success: true, already: true, message: 'Sei già iscritto alla newsletter.' });
    }

    let confirmToken = existing?.confirm_token || newToken();

    if (existing) {
      // pending o unsubscribed → riporta a pending e aggiorna il consenso.
      await supabaseAdmin
        .from('newsletter_subscribers')
        .update({ status: 'pending', consent_at: now, ip, user_agent: userAgent, source })
        .eq('id', existing.id);
    } else {
      confirmToken = newToken();
      const { error } = await supabaseAdmin.from('newsletter_subscribers').insert({
        email,
        status: 'pending',
        confirm_token: confirmToken,
        unsubscribe_token: newToken(),
        consent_at: now,
        ip,
        user_agent: userAgent,
        source,
      });
      if (error) {
        // Race sull'unique index → trattalo come pending (manda comunque la conferma).
        console.error('[newsletter/subscribe] insert:', error.message);
      }
    }

    const confirmUrl = `${origin}/api/newsletter/confirm?token=${encodeURIComponent(confirmToken)}`;
    await sendEmail(email, 'Conferma la tua iscrizione · RescueManager', confirmEmailHtml(confirmUrl));

    return NextResponse.json({ success: true, message: 'Ti abbiamo inviato un\'email di conferma.' });
  } catch (e) {
    console.error('[newsletter/subscribe]', e);
    return NextResponse.json({ success: false, error: 'Errore interno.' }, { status: 500 });
  }
}
