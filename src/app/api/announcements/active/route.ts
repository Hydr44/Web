import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

/**
 * GET /api/announcements/active?platform=web|desktop|mobile
 *
 * Avvisi attivi (banner in-app), PUBBLICO + CORS: lo leggono web, desktop
 * (remote-control) e mobile senza sessione. Filtra per finestra temporale
 * (starts_at/ends_at) e per target di piattaforma. Se la tabella non esiste
 * ancora → lista vuota (nessun avviso).
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const platform = new URL(request.url).searchParams.get('platform') || 'web';
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('id, title, body, level, target, dismissible, starts_at, ends_at, updated_at')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ announcements: [] }, { headers: corsHeaders(origin) });
    }

    const list = (data || []).filter((a) => {
      if (a.starts_at && a.starts_at > nowIso) return false;
      if (a.ends_at && a.ends_at < nowIso) return false;
      if (a.target && a.target !== 'all' && a.target !== platform) return false;
      return true;
    });

    return NextResponse.json(
      { announcements: list },
      { headers: { ...corsHeaders(origin), 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ announcements: [] }, { headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
