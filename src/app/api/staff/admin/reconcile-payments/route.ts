// Riconciliazione pagamenti orfani (F5, gap #16). Backstop alla garanzia "il
// pagamento non si perde mai": cerca su Stripe i checkout PAGATI delle ultime 48h
// e verifica che il preventivo corrispondente sia segnato 'paid'; se un webhook è
// andato perso, recupera (marca paid + lead in_verifica). Solo staff (admin).
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  if (!requireStaffRole(staff, 'admin', 'manager')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403 });
  }

  const sinceUnix = Math.floor(Date.now() / 1000) - 48 * 3600;
  const recovered: { quote_id: string; session: string }[] = [];
  const orphans: { session: string; reason: string }[] = [];
  let checked = 0;

  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: sinceUnix } });
    for (const session of sessions.data) {
      if (session.payment_status !== 'paid' && session.status !== 'complete') continue;
      checked++;
      const quoteId = session.metadata?.quote_id;
      if (!quoteId) { orphans.push({ session: session.id, reason: 'no quote_id nei metadata' }); continue; }

      const { data: quote } = await supabaseAdmin
        .from('lead_quotes')
        .select('id, status, paid_at, lead_id')
        .eq('id', quoteId)
        .maybeSingle();
      if (!quote) { orphans.push({ session: session.id, reason: `quote ${quoteId} non trovato` }); continue; }

      // Se è già pagato/attivato, ok. Altrimenti: webhook perso → recupera.
      if (quote.paid_at || ['paid', 'pending_activation', 'activated'].includes(quote.status as string)) continue;

      await supabaseAdmin.from('lead_quotes').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        activation_pending: true,
        stripe_subscription_id: (session.subscription as string) || null,
        stripe_payment_intent_id: (session.payment_intent as string) || null,
      }).eq('id', quoteId);

      if (quote.lead_id) {
        await supabaseAdmin.from('leads').update({ status: 'in_verifica' })
          .eq('id', quote.lead_id)
          .in('status', ['quote_sent', 'trattativa']);
      }
      recovered.push({ quote_id: quoteId, session: session.id });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Errore riconciliazione' }, { status: 502 });
  }

  return NextResponse.json({ success: true, checked, recovered_count: recovered.length, recovered, orphans });
}
