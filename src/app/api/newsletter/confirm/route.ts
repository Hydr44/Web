/**
 * GET /api/newsletter/confirm?token=...
 * Conferma il double opt-in: stato 'confirmed' + aggiunge il contatto
 * all'Audience Resend. Reindirizza a /newsletter?stato=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { addToAudience } from '@/lib/newsletter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const go = (stato: string) => NextResponse.redirect(`${url.origin}/newsletter?stato=${stato}`);

  if (!token) return go('errore');

  try {
    const { data: sub } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, email, status')
      .eq('confirm_token', token)
      .maybeSingle();

    if (!sub) return go('errore');
    if (sub.status === 'confirmed') return go('confermato');

    const contactId = await addToAudience(sub.email);

    await supabaseAdmin
      .from('newsletter_subscribers')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        unsubscribed_at: null,
        resend_contact_id: contactId,
      })
      .eq('id', sub.id);

    return go('confermato');
  } catch (e) {
    console.error('[newsletter/confirm]', e);
    return go('errore');
  }
}
