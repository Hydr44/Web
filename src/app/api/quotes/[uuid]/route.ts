/**
 * Public Quote API
 * GET  /api/quotes/:uuid - Visualizza preventivo pubblico
 * POST /api/quotes/:uuid - Accetta preventivo
 * No auth required - uses public_uuid
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu';
const LEAD_API_URL = process.env.LEAD_API_URL || 'http://lead-api.rescuemanager.eu';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Custom'
};

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { data: quote, error } = await supabaseAdmin
      .from('lead_quotes')
      .select('*, leads!lead_quotes_lead_id_fkey(name, company, email)')
      .eq('public_uuid', params.uuid)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { success: false, error: 'Preventivo non trovato' },
        { status: 404 }
      );
    }

    // Track view
    if (quote.status === 'sent' && !quote.viewed_at) {
      await supabaseAdmin
        .from('lead_quotes')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .eq('id', quote.id);
      quote.status = 'viewed';
      quote.viewed_at = new Date().toISOString();
    }

    // Strip internal fields
    const publicQuote = {
      quote_number: quote.quote_number,
      plan_type: quote.plan_type,
      base_modules: quote.base_modules,
      special_modules: quote.special_modules,
      customizations: quote.customizations,
      base_price: quote.base_price,
      special_modules_price: quote.special_modules_price,
      customizations_price: quote.customizations_price,
      discount_percent: quote.discount_percent,
      discount_amount: quote.discount_amount,
      monthly_total: quote.monthly_total,
      yearly_total: quote.yearly_total,
      setup_fee: quote.setup_fee,
      contract_duration: quote.contract_duration,
      payment_method: quote.payment_method,
      billing_frequency: quote.billing_frequency,
      special_terms: quote.special_terms,
      status: quote.status,
      quote_date: quote.quote_date,
      expiry_date: quote.expiry_date,
      pdf_url: quote.pdf_url,
      lead_name: quote.leads?.name,
      lead_company: quote.leads?.company,
      is_expired: new Date(quote.expiry_date) < new Date() && !['accepted', 'paid'].includes(quote.status),
    };

    return NextResponse.json({ success: true, quote: publicQuote });
  } catch (error: any) {
    console.error('[QUOTE] public view error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const body = await request.json();
    const { action } = body;

    const { data: quote, error } = await supabaseAdmin
      .from('lead_quotes')
      .select('*')
      .eq('public_uuid', params.uuid)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { success: false, error: 'Preventivo non trovato' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      if (!['sent', 'viewed'].includes(quote.status)) {
        return NextResponse.json(
          { success: false, error: 'Preventivo non accettabile in questo stato' },
          { status: 400 }
        );
      }

      if (new Date(quote.expiry_date) < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Preventivo scaduto' },
          { status: 400 }
        );
      }

      // Determina intervallo e importo Stripe
      const isYearly = quote.contract_duration === 'yearly';
      const isBiennial = quote.contract_duration === 'biennial';
      const interval = (isYearly || isBiennial) ? 'year' : 'month';
      const intervalCount = isBiennial ? 2 : 1;
      const unitAmount = isYearly
        ? Math.round((quote.yearly_total || quote.monthly_total * 12 * 0.9) * 100)
        : isBiennial
        ? Math.round((quote.monthly_total * 24 * 0.85) * 100)
        : Math.round(quote.monthly_total * 100);

      const planLabel = PLAN_LABELS[quote.plan_type] || quote.plan_type;

      // Crea Stripe checkout session
      const lineItems: any[] = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `RescueManager Piano ${planLabel}`,
              description: `Accesso piattaforma RescueManager — ${quote.quote_number}`,
            },
            unit_amount: unitAmount,
            recurring: { interval, interval_count: intervalCount },
          },
          quantity: 1,
        },
      ];

      const subscriptionData: any = {
        metadata: { quote_id: quote.id, lead_id: quote.lead_id, quote_uuid: params.uuid },
      };

      if ((quote.setup_fee || 0) > 0) {
        subscriptionData.add_invoice_items = [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: 'Setup iniziale RescueManager' },
              unit_amount: Math.round(quote.setup_fee * 100),
            },
          },
        ];
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: lineItems,
        payment_method_types: ['card'],
        success_url: `${SITE_URL}/quotes/${params.uuid}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/quotes/${params.uuid}`,
        metadata: { quote_id: quote.id, lead_id: quote.lead_id, quote_uuid: params.uuid },
        subscription_data: subscriptionData,
        locale: 'it',
        allow_promotion_codes: false,
      });

      // Aggiorna quote con session ID e status accepted
      await supabaseAdmin
        .from('lead_quotes')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
        })
        .eq('id', quote.id);

      // Aggiorna lead status
      await supabaseAdmin
        .from('leads')
        .update({ status: 'quote_sent', updated_at: new Date().toISOString() })
        .eq('id', quote.lead_id);

      return NextResponse.json({
        success: true,
        message: 'Preventivo accettato! Reindirizzamento al pagamento...',
        checkout_url: session.url,
      });
    }

    if (action === 'reject') {
      if (!['sent', 'viewed'].includes(quote.status)) {
        return NextResponse.json(
          { success: false, error: 'Preventivo non rifiutabile in questo stato' },
          { status: 400 }
        );
      }

      const reason = body.reason || '';
      await supabaseAdmin
        .from('lead_quotes')
        .update({ status: 'rejected' })
        .eq('id', quote.id);

      // Log modification request if reason provided
      if (reason) {
        await supabaseAdmin
          .from('lead_quote_modifications')
          .insert({
            quote_id: quote.id,
            requested_by: 'client',
            modification_text: reason,
          });
      }

      return NextResponse.json({
        success: true,
        message: 'Preventivo rifiutato. Grazie per il feedback.',
      });
    }

    if (action === 'request_modification') {
      const modificationText = body.modification_text;
      if (!modificationText) {
        return NextResponse.json(
          { success: false, error: 'Testo modifica richiesto' },
          { status: 400 }
        );
      }

      await supabaseAdmin
        .from('lead_quote_modifications')
        .insert({
          quote_id: quote.id,
          requested_by: 'client',
          modification_text: modificationText,
          modules_to_add: body.modules_to_add || null,
          modules_to_remove: body.modules_to_remove || null,
          notes: body.notes || null,
        });

      return NextResponse.json({
        success: true,
        message: 'Richiesta di modifica inviata. Ti ricontatteremo al più presto.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Azione non valida. Usa: accept, reject, request_modification' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[QUOTE] public action error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno' },
      { status: 500 }
    );
  }
}
