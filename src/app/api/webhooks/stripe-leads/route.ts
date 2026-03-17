/**
 * Stripe Webhook - Lead/Quote payments
 * POST /api/webhooks/stripe-leads
 * Handles: checkout.session.completed
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const LEAD_API_URL = process.env.LEAD_API_URL || 'http://lead-api.rescuemanager.eu';
const VPS_API_KEY = process.env.VPS_API_KEY || '';
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
      // Aggiorna quote con subscription/payment info
      const updatePayload: Record<string, any> = {
        status: 'paid',
        paid_at: new Date().toISOString(),
      };

      if (session.subscription) {
        updatePayload.stripe_subscription_id = session.subscription;
      }
      if (session.payment_intent) {
        updatePayload.stripe_payment_intent_id = session.payment_intent;
      }

      console.log('[STRIPE-LEADS] Updating quote status to paid');
      await supabaseAdmin
        .from('lead_quotes')
        .update(updatePayload)
        .eq('id', quote_id);

      // Chiama VPS convert endpoint
      console.log('[STRIPE-LEADS] Calling VPS convert endpoint:', LEAD_API_URL);
      const convertRes = await fetch(`${LEAD_API_URL}/api/leads/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': VPS_API_KEY,
        },
        body: JSON.stringify({
          quote_id,
          stripe_subscription_id: session.subscription || null,
          stripe_payment_intent_id: session.payment_intent || null,
        }),
      });

      console.log('[STRIPE-LEADS] VPS response status:', convertRes.status);
      
      if (convertRes.ok) {
        console.log('[STRIPE-LEADS] Lead converted successfully, quote_id:', quote_id);
      } else {
        const errData = await convertRes.json().catch(() => ({}));
        console.error('[STRIPE-LEADS] Convert failed:', errData);
      }
    } catch (err: any) {
      console.error('[STRIPE-LEADS] Error processing payment:', err.message);
      console.error('[STRIPE-LEADS] Error stack:', err.stack);
      return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
