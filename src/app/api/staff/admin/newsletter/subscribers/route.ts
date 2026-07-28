/**
 * GET /api/staff/admin/newsletter/subscribers → conteggi iscritti per stato.
 * (la tabella newsletter_subscribers è server-only, quindi i numeri passano da qui)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

async function countByStatus(status: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });

  const [confirmed, pending, unsubscribed] = await Promise.all([
    countByStatus('confirmed'),
    countByStatus('pending'),
    countByStatus('unsubscribed'),
  ]);

  return NextResponse.json(
    { success: true, stats: { confirmed, pending, unsubscribed } },
    { headers: corsHeaders(origin) },
  );
}
