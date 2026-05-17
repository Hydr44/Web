import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Returns whether 2FA is globally mandatory for dashboard access.
 * Read-only policy boolean (no sensitive data) — consumed by the dashboard
 * layout gate to decide if a non-AAL2 session must complete 2FA.
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'mandatory_2fa_enabled')
      .maybeSingle();

    const mandatory = data?.value === true || data?.value === 'true';
    return NextResponse.json({ success: true, mandatory }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('2fa-status error:', error);
    // Fail open (do not lock users out if the settings read fails).
    return NextResponse.json({ success: true, mandatory: false }, { headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
