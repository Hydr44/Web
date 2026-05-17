import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Ultima release desktop per piattaforma (pubblico) — alimenta la pagina
 * /download. Legge i metadati scritti dal finalize in system_settings
 * (key app_release_{win|mac|linux}); il link punta al feed pubblico
 * /api/app-update/{filename} che fa 302 verso R2 firmato.
 */
type Rel = { version?: string; filename?: string; size?: number; releaseDate?: string };

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', ['app_release_win', 'app_release_mac', 'app_release_linux']);

    const out: Record<string, (Rel & { url: string }) | null> = { win: null, mac: null, linux: null };
    for (const row of data || []) {
      const plat = row.key.replace('app_release_', '') as 'win' | 'mac' | 'linux';
      const v = (row.value || {}) as Rel;
      if (v.filename) {
        out[plat] = { ...v, url: `/api/app-update/${encodeURIComponent(v.filename)}` };
      }
    }
    return NextResponse.json({ success: true, releases: out }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('app-release/latest error:', error);
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
