import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const VALID_PLANS = ['starter', 'professional', 'business', 'full'];
const PLAN_TO_PRICE: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || '',
  professional: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
  business: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL || '',
  full: process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL || '',
};

function getBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Token mancante' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { data: link, error } = await supabaseAdmin
      .from('plan_activation_links')
      .select('id, org_id, plan, expires_at, used_at, link_type')
      .eq('token', token)
      .single();

    if (error || !link) {
      return NextResponse.json(
        { ok: false, error: 'Link non valido' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const now = new Date();
    if (new Date(link.expires_at) < now) {
      return NextResponse.json(
        { ok: false, error: 'Link scaduto' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const linkType = link.link_type === 'purchase' ? 'purchase' : 'trial';

    if (linkType === 'purchase') {
      const plan = VALID_PLANS.includes(link.plan) ? link.plan : 'Starter';
      const priceId = PLAN_TO_PRICE[plan];
      const base = getBaseUrl(request);
      const redirectUrl = `${base}/api/checkout?price=${encodeURIComponent(priceId)}&org=${encodeURIComponent(link.org_id)}&return=${encodeURIComponent('/dashboard/billing')}`;
      return NextResponse.json(
        { ok: true, type: 'purchase', redirect_url: redirectUrl, plan },
        { headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { ok: true, type: 'trial', plan: link.plan },
      { headers: corsHeaders(origin) }
    );
  } catch (e) {
    console.error('[activate/info]', e);
    return NextResponse.json(
      { ok: false, error: 'Errore' },
      { status: 500 }
    );
  }
}
