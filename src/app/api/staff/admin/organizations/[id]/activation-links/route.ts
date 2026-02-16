import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { randomBytes } from 'crypto';

const VALID_PLANS = ['Starter', 'Professional', 'Business', 'Full'];
const VALID_MODULES = ['sdi', 'rvfu', 'rentri'];

function generateToken(): string {
  return randomBytes(24).toString('hex');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const staff = await getStaffFromRequest(request as any);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const { id: orgId } = await params;

    const body = await request.json().catch(() => ({}));
    const linkType = (body.link_type as string) === 'purchase' ? 'purchase' : 'trial';
    const plan = (body.plan as string) || 'Starter';
    const rawModules = Array.isArray(body.modules) ? body.modules : [];
    const modules = rawModules.filter((m: string) => VALID_MODULES.includes(m));
    const expiresDays = Math.min(30, Math.max(1, Number(body.expires_days) || 14));
    const trialDays = linkType === 'trial' ? Math.min(90, Math.max(1, Number(body.trial_days) || 7)) : null;

    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { success: false, error: `Piano non valido. Usa: ${VALID_PLANS.join(', ')}` },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { data: org } = await supabaseAdmin
      .from('orgs')
      .select('id')
      .eq('id', orgId)
      .single();

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organizzazione non trovata' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const { data: link, error } = await supabaseAdmin
      .from('plan_activation_links')
      .insert({
        token,
        org_id: orgId,
        plan,
        modules: modules.length > 0 ? modules : [],
        link_type: linkType,
        trial_days: trialDays,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, token, expires_at')
      .single();

    if (error) {
      console.error('[activation-links]', error);
      return NextResponse.json(
        { success: false, error: 'Errore creazione link' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu';
    const url = `${baseUrl}/activate/${token}`;

    return NextResponse.json(
      {
        success: true,
        url,
        token,
        plan,
        link_type: linkType,
        trial_days: trialDays,
        modules: modules.length > 0 ? modules : null,
        expires_at: link.expires_at,
      },
      { headers: corsHeaders(origin) }
    );
  } catch (e) {
    console.error('[activation-links]', e);
    return NextResponse.json(
      { success: false, error: 'Errore interno' },
      { status: 500 }
    );
  }
}
