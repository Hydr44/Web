import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Returns whether public registration (access requests) is enabled.
 * Read-only policy boolean — consumed by /register to disable the form
 * up-front. The real enforcement is server-side in /api/contact.
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'registration_enabled')
      .maybeSingle();

    const enabled = data?.value !== false && data?.value !== 'false';
    return NextResponse.json({ success: true, enabled }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('registration-status error:', error);
    // Fail open: non bloccare le registrazioni se la lettura fallisce.
    return NextResponse.json({ success: true, enabled: true }, { headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
