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
const LEAD_API_URL = (process.env.LEAD_API_URL || "https://lead-api.rescuemanager.eu").replace(/^http:/, "https:");
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

    // Track view (incrementa contatore sempre, aggiorna status solo prima volta)
    const now = new Date().toISOString();
    const viewedCount = (quote.viewed_count || 0) + 1;
    const updatePayload: Record<string, any> = {
      viewed_count: viewedCount,
      last_viewed_at: now,
    };
    if (quote.status === 'sent' && !quote.viewed_at) {
      updatePayload.status = 'viewed';
      updatePayload.viewed_at = now;
      quote.status = 'viewed';
      quote.viewed_at = now;
    }
    await supabaseAdmin.from('lead_quotes').update(updatePayload).eq('id', quote.id);

    // Activity log
    try {
      await supabaseAdmin.from('lead_activities').insert({
        lead_id: quote.lead_id,
        activity_type: 'quote_viewed',
        title: `Preventivo ${quote.quote_number} visualizzato`,
        description: `View #${viewedCount}`,
        performed_by_type: 'lead',
        related_quote_id: quote.id,
        metadata: { view_count: viewedCount },
      });
    } catch {}

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

      // ─── FLOW APPROVAZIONE INTERNA (requires_approval=true) ──────────
      // Cliente clicca "Accetto" → status=accepted ma NO Stripe.
      // L'admin riceve notifica + task automatica, dopo approvazione
      // verrà generato/inviato il link Stripe.
      if (quote.requires_approval === true) {
        const clientIp = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
          || request.headers.get('x-real-ip') || null;
        const userAgent = request.headers.get('user-agent') || null;

        await supabaseAdmin
          .from('lead_quotes')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            acceptance_ip: clientIp,
            acceptance_user_agent: userAgent,
            acceptance_signature_data: body.signature_data || null,
          })
          .eq('id', quote.id);

        // Activity log
        try {
          await supabaseAdmin.from('lead_activities').insert({
            lead_id: quote.lead_id,
            activity_type: 'quote_accepted',
            title: `Cliente ha accettato il preventivo ${quote.quote_number} — IN ATTESA DI APPROVAZIONE INTERNA`,
            description: `Da approvare prima di inviare link pagamento. IP: ${clientIp || '—'}`,
            performed_by_type: 'lead',
            related_quote_id: quote.id,
            metadata: { ip: clientIp, user_agent: userAgent, requires_internal_approval: true },
          });
        } catch {}

        // Task automatica per lo staff: "Approvare preventivo X"
        try {
          await supabaseAdmin.from('lead_tasks').insert({
            lead_id: quote.lead_id,
            title: `Approvare preventivo ${quote.quote_number} accettato dal cliente`,
            description: `Il cliente ha accettato il preventivo. Approva per inviare il link di pagamento.`,
            priority: 'high',
            status: 'open',
            due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // entro 24h
          });
        } catch {}

        return NextResponse.json({
          success: true,
          requires_approval: true,
          message: 'Grazie! Abbiamo ricevuto la tua accettazione. Un nostro responsabile la approverà a breve e ti invierà il link per il pagamento via email.',
        });
      }

      // ─── FLOW STANDARD: Stripe checkout subito ────────────────────────
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
        // F5: dopo il pagamento → wizard di configurazione (il wizard conferma il
        // pagamento e poi guida l'upload visura). paid=1 segnala l'arrivo dal checkout.
        success_url: `${SITE_URL}/configura/${params.uuid}?paid=1`,
        cancel_url: `${SITE_URL}/quotes/${params.uuid}`,
        metadata: { quote_id: quote.id, lead_id: quote.lead_id, quote_uuid: params.uuid },
        subscription_data: subscriptionData,
        locale: 'it',
        allow_promotion_codes: false,
      });

      // Audit accept
      const clientIp = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
        || request.headers.get('x-real-ip') || null;
      const userAgent = request.headers.get('user-agent') || null;

      await supabaseAdmin
        .from('lead_quotes')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
          acceptance_ip: clientIp,
          acceptance_user_agent: userAgent,
          acceptance_signature_data: body.signature_data || null,
        })
        .eq('id', quote.id);

      // Aggiorna lead status
      await supabaseAdmin
        .from('leads')
        .update({ status: 'quote_sent', updated_at: new Date().toISOString() })
        .eq('id', quote.lead_id);

      // Activity log
      try {
        await supabaseAdmin.from('lead_activities').insert({
          lead_id: quote.lead_id,
          activity_type: 'quote_accepted',
          title: `Preventivo ${quote.quote_number} accettato`,
          description: `IP: ${clientIp || '—'}`,
          performed_by_type: 'lead',
          related_quote_id: quote.id,
          metadata: { ip: clientIp, user_agent: userAgent },
        });
      } catch {}

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
      const clientIp = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
        || request.headers.get('x-real-ip') || null;

      await supabaseAdmin
        .from('lead_quotes')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
          rejection_ip: clientIp,
        })
        .eq('id', quote.id);

      try {
        await supabaseAdmin.from('lead_activities').insert({
          lead_id: quote.lead_id,
          activity_type: 'quote_rejected',
          title: `Preventivo ${quote.quote_number} rifiutato`,
          description: reason || null,
          performed_by_type: 'lead',
          related_quote_id: quote.id,
          metadata: { ip: clientIp, reason },
        });
      } catch {}

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
