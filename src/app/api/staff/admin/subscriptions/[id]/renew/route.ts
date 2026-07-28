import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { verifyStaffToken } from '@/lib/staff-auth';

// Rinnovo manuale "avvenuto pagamento" di un abbonamento org.
// id = org_id (PK di org_subscriptions). Pensato per pagamenti FUORI Stripe
// (bonifico/SEPA) confermati a mano dallo staff dal pannello admin → Clienti.
//
// Differenza da /reactivate: qui NON si rifiuta se già attivo (rinnovo
// anticipato a pagamento ricevuto è lecito) e la nuova scadenza si ESTENDE
// dalla scadenza corrente se ancora futura, senza perdere il tempo residuo.

const INTERVALS = ['monthly', 'yearly', 'biennial'] as const;
type Interval = (typeof INTERVALS)[number];

function parseRenewBody(body: Record<string, unknown>) {
  const interval: Interval = INTERVALS.includes(body?.interval as Interval)
    ? (body.interval as Interval)
    : 'yearly';
  const note = typeof body?.note === 'string' && body.note.trim()
    ? body.note.trim().slice(0, 500)
    : null;
  const amountNum = Number(body?.amount);
  const amount = Number.isFinite(amountNum) && amountNum > 0 ? amountNum : null;
  const paymentDate = typeof body?.payment_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.payment_date)
    ? body.payment_date
    : null;
  return { interval, note, amount, paymentDate };
}

// Nuova scadenza: estende da current_period_end se ancora futura, altrimenti da oggi.
function computeNewPeriodEnd(currentEnd: string | null | undefined, interval: Interval, now: Date): Date {
  const cur = currentEnd ? new Date(currentEnd) : null;
  const anchor = cur && cur.getTime() > now.getTime() ? cur : now;
  const end = new Date(anchor);
  if (interval === 'biennial') end.setFullYear(end.getFullYear() + 2);
  else if (interval === 'monthly') end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1); // yearly (default)
  return end;
}

// Best-effort: registra la riga di pagamento nel ledger. Se la tabella non
// esiste ancora (migration 20260728 non applicata su questo ambiente) il
// rinnovo resta valido lo stesso — non facciamo fallire la richiesta.
async function logPayment(row: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('org_subscription_payments').insert(row);
    if (error) console.warn('org_subscription_payments insert skipped:', error.message);
    return !error;
  } catch (e: unknown) {
    console.warn('org_subscription_payments insert exception:', (e as Error)?.message);
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin');
  try {
    const { id: orgId } = await params;

    // L'AUTH è già garantita dal middleware su /api/staff/* (identico a
    // reactivate/cancel). NON ri-gate-iamo qui con un lookup DB su `staff`:
    // farlo dava 401 se il sub del token non combaciava con una riga staff.
    // Leggiamo solo l'email dal token in best-effort per il ledger, senza mai
    // bloccare il rinnovo.
    let recordedBy: string | null = null;
    try {
      const auth = request.headers.get('authorization');
      if (auth?.startsWith('Bearer ')) {
        const payload = await verifyStaffToken(auth.slice(7));
        recordedBy = payload?.email ?? null;
      }
    } catch { /* best-effort: email opzionale */ }

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const { interval, note, amount, paymentDate } = parseRenewBody(body);

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (fetchError || !sub) {
      return NextResponse.json(
        { success: false, error: 'Abbonamento non trovato' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    // Un abbonamento cancellato va riportato in vita dalla riattivazione,
    // non "rinnovato" silenziosamente.
    if (sub.status === 'canceled' || sub.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Abbonamento cancellato: usa la riattivazione' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const now = new Date();
    const newEnd = computeNewPeriodEnd(sub.current_period_end, interval, now);

    // NB: billing_type OMESSO dal SET. Il trigger normalize_org_subscription_billing_type
    // (migration 20260623) riscrive NEW.billing_type solo se NULL o fuori
    // whitelist; non toccandolo, il valore valido già a DB resta invariato.
    // La frequenza NON va mai in billing_type: è espressa da current_period_end.
    const { error: updateError } = await supabaseAdmin
      .from('org_subscriptions')
      .update({
        status: 'active',
        current_period_end: newEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('org_id', orgId);

    if (updateError) {
      console.error('Error renewing subscription:', updateError);
      return NextResponse.json(
        { success: false, error: 'Errore durante il rinnovo' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const payment_logged = await logPayment({
      org_id: orgId,
      amount,
      payment_date: paymentDate || now.toISOString().slice(0, 10),
      renew_interval: interval,
      period_end: newEnd.toISOString(),
      method: 'manual',
      note,
      recorded_by: recordedBy,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Abbonamento rinnovato',
        current_period_end: newEnd.toISOString(),
        payment_logged,
      },
      { headers: corsHeaders(origin) }
    );
  } catch (error: unknown) {
    console.error('Admin renew subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
