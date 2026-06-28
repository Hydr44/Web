/**
 * GET /api/newsletter/unsubscribe?token=...
 * Disiscrizione one-click (link in ogni email + header List-Unsubscribe).
 * Stato 'unsubscribed' + marca il contatto come unsubscribed su Resend.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unsubscribeFromAudience } from '@/lib/newsletter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const go = (stato: string) => NextResponse.redirect(`${url.origin}/newsletter?stato=${stato}`);

  if (!token) return go('errore');

  try {
    const { data: sub } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, email')
      .eq('unsubscribe_token', token)
      .maybeSingle();

    if (!sub) return go('errore');

    await unsubscribeFromAudience(sub.email);

    await supabaseAdmin
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', sub.id);

    return go('annullato');
  } catch (e) {
    console.error('[newsletter/unsubscribe]', e);
    return go('errore');
  }
}
