/**
 * POST /api/staff/admin/leads/:id/quotes/:qid/approve
 * Approva un preventivo in stato pending_approval — passa a 'draft' pronto per invio.
 *
 * Body opzionale:
 *   approved_by: uuid (staff user)
 *   notes: string
 *
 * POST con ?action=reject per rifiutarlo invece (status='rejected')
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { stripe } from '@/lib/stripe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu';
const LEAD_API_URL = process.env.LEAD_API_URL || 'https://lead-api.rescuemanager.eu';
const VPS_API_KEY = process.env.VPS_API_KEY || '';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Custom',
};

export async function POST(
  request: Request,
  { params }: { params: { id: string; qid: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'approve';
    const body = await request.json().catch(() => ({}));

    const { data: quote, error: qErr } = await supabaseAdmin
      .from('lead_quotes')
      .select('*, leads!lead_quotes_lead_id_fkey(id,name,email,company)')
      .eq('id', params.qid)
      .eq('lead_id', params.id)
      .single();

    if (qErr || !quote) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404, headers: corsHeaders(origin) });
    }

    const lead = (quote as any).leads;

    // ─── CASO A: pending_approval interno (admin pre-invio) ──────────────
    //   Admin approva preventivo PRIMA che venga inviato al cliente.
    //   status: pending_approval → draft (pronto invio)
    if (quote.status === 'pending_approval') {
      const newStatus = action === 'reject' ? 'rejected' : 'draft';
      const updatePayload: Record<string, any> = {
        status: newStatus,
        approved_by: body.approved_by || null,
        approved_at: new Date().toISOString(),
      };
      if (action === 'reject') {
        updatePayload.rejected_at = new Date().toISOString();
        updatePayload.rejection_reason = body.notes || 'Rifiutato in fase di approvazione';
      }

      const { error: uErr } = await supabaseAdmin
        .from('lead_quotes').update(updatePayload).eq('id', params.qid);
      if (uErr) {
        return NextResponse.json({ success: false, error: uErr.message }, { status: 500, headers: corsHeaders(origin) });
      }

      await supabaseAdmin.from('lead_activities').insert({
        lead_id: quote.lead_id,
        activity_type: action === 'reject' ? 'quote_rejected_internal' : 'quote_approved',
        title: action === 'reject'
          ? `Preventivo ${quote.quote_number} rifiutato in approvazione`
          : `Preventivo ${quote.quote_number} approvato — pronto per invio`,
        description: body.notes || null,
        performed_by: body.approved_by || null,
        performed_by_type: 'staff',
        related_quote_id: params.qid,
      });

      return NextResponse.json({
        success: true,
        message: action === 'reject' ? 'Preventivo rifiutato' : 'Preventivo approvato',
        status: newStatus,
        stage: 'internal_preview',
      }, { headers: corsHeaders(origin) });
    }

    // ─── CASO B: cliente ha già accettato (con requires_approval=true) ───
    //   Cliente ha cliccato "Accetto" sulla pagina pubblica del preventivo.
    //   status='accepted' + requires_approval=true.
    //   Admin approva → genera Stripe checkout + invia email cliente con link.
    if (quote.status === 'accepted' && quote.requires_approval === true) {
      if (action === 'reject') {
        // Admin rifiuta dopo accept cliente — comunica al cliente
        await supabaseAdmin.from('lead_quotes').update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: body.notes || 'Rifiutato in fase di approvazione interna',
        }).eq('id', params.qid);

        await supabaseAdmin.from('lead_activities').insert({
          lead_id: quote.lead_id,
          activity_type: 'quote_rejected_internal',
          title: `Preventivo ${quote.quote_number} rifiutato dopo accettazione cliente`,
          description: body.notes || null,
          performed_by: body.approved_by || null,
          performed_by_type: 'staff',
          related_quote_id: params.qid,
        });

        return NextResponse.json({
          success: true, message: 'Preventivo rifiutato',
          status: 'rejected', stage: 'post_client_accept',
        }, { headers: corsHeaders(origin) });
      }

      // Genera Stripe checkout
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
      const subscriptionData: any = {
        metadata: { quote_id: quote.id, lead_id: quote.lead_id, quote_uuid: quote.public_uuid },
      };
      if ((quote.setup_fee || 0) > 0) {
        subscriptionData.add_invoice_items = [{
          price_data: {
            currency: 'eur',
            product_data: { name: 'Setup iniziale RescueManager' },
            unit_amount: Math.round(quote.setup_fee * 100),
          },
        }];
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{
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
        }],
        payment_method_types: ['card'],
        success_url: `${SITE_URL}/quotes/${quote.public_uuid}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/quotes/${quote.public_uuid}`,
        metadata: { quote_id: quote.id, lead_id: quote.lead_id, quote_uuid: quote.public_uuid },
        subscription_data: subscriptionData,
        locale: 'it',
      });

      await supabaseAdmin.from('lead_quotes').update({
        approved_by: body.approved_by || null,
        approved_at: new Date().toISOString(),
        stripe_checkout_session_id: session.id,
        payment_link_url: session.url,
      }).eq('id', params.qid);

      // Invia email cliente con link Stripe — usa builder brandato dedicato VPS
      if (lead?.email) {
        try {
          await fetch(`${LEAD_API_URL}/api/leads/${quote.lead_id}/quotes/${quote.id}/send-payment-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': VPS_API_KEY },
            body: JSON.stringify({
              checkout_url: session.url,
              staff_id: body.approved_by || null,
            }),
          });
        } catch (e: any) {
          console.warn('[approve] failed sending payment link email:', e.message);
        }
      }

      // Chiudi task automatica creata quando cliente accettò
      await supabaseAdmin.from('lead_tasks').update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: body.approved_by || null,
      })
      .eq('lead_id', quote.lead_id)
      .eq('status', 'open')
      .ilike('title', `%${quote.quote_number}%`);

      await supabaseAdmin.from('lead_activities').insert({
        lead_id: quote.lead_id,
        activity_type: 'quote_approved',
        title: `Preventivo ${quote.quote_number} approvato — link pagamento inviato al cliente`,
        description: `Stripe checkout: ${session.id}`,
        performed_by: body.approved_by || null,
        performed_by_type: 'staff',
        related_quote_id: params.qid,
      });

      return NextResponse.json({
        success: true,
        message: 'Approvato — link pagamento inviato al cliente',
        status: 'accepted',
        stage: 'post_client_accept',
        checkout_url: session.url,
      }, { headers: corsHeaders(origin) });
    }

    return NextResponse.json({
      success: false,
      error: `Preventivo in stato '${quote.status}' (requires_approval=${quote.requires_approval}) — non può essere approvato qui.`,
    }, { status: 400, headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
