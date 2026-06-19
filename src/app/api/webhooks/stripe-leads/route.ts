/**
 * Stripe Webhook - Lead/Quote payments
 * POST /api/webhooks/stripe-leads
 * Handles: checkout.session.completed
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_LEADS_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  console.log('[STRIPE-LEADS] Webhook received');
  
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !WEBHOOK_SECRET) {
    console.error('[STRIPE-LEADS] Missing signature or secret');
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    console.log('[STRIPE-LEADS] Event verified:', event.type);
  } catch (err: any) {
    console.error('[STRIPE-LEADS] Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { quote_id } = session.metadata || {};

    console.log('[STRIPE-LEADS] Checkout completed, quote_id:', quote_id);

    if (!quote_id) {
      console.warn('[STRIPE-LEADS] No quote_id in session metadata, skipping');
      return NextResponse.json({ received: true });
    }

    try {
      // Carica quote per leggere flag auto_activate_on_payment
      const { data: quote } = await supabaseAdmin
        .from('lead_quotes')
        .select('lead_id, quote_number')
        .eq('id', quote_id)
        .single();

      const updatePayload: Record<string, any> = {
        status: 'paid',
        paid_at: new Date().toISOString(),
        activation_pending: true,  // Sempre true: admin vede pending finché non attiva
      };
      if (session.subscription) updatePayload.stripe_subscription_id = session.subscription;
      if (session.payment_intent) updatePayload.stripe_payment_intent_id = session.payment_intent;

      await supabaseAdmin.from('lead_quotes').update(updatePayload).eq('id', quote_id);

      // Activity log
      if (quote?.lead_id) {
        await supabaseAdmin.from('lead_activities').insert({
          lead_id: quote.lead_id,
          activity_type: 'payment_received',
          title: `Pagamento ricevuto — ${quote.quote_number || ''}`,
          description: `Stripe checkout completato`,
          performed_by_type: 'system',
          related_quote_id: quote_id,
          metadata: { stripe_session: session.id, subscription: session.subscription, amount: session.amount_total },
        });
      }

      // Flusso unico (modello C): pagamento ricevuto → il lead entra in coda
      // Revisione (in_verifica). L'org/attivazione viene creata SOLO all'approvazione
      // admin in Revisione (mai automaticamente al pagamento).
      // Guardato + idempotente: aggiorna SOLO se ancora quote_sent/trattativa, così
      // i retry del webhook (o stati successivi come attivato) non lo riportano indietro.
      if (quote?.lead_id) {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'in_verifica' })
          .eq('id', quote.lead_id)
          .in('status', ['quote_sent', 'trattativa']);
      }
      console.log('[STRIPE-LEADS] Lead → in_verifica (revisione manuale) for quote', quote_id);
    } catch (err: any) {
      console.error('[STRIPE-LEADS] Error processing payment:', err.message);
      console.error('[STRIPE-LEADS] Error stack:', err.stack);
      return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
