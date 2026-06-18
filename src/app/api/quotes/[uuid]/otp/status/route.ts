// Stato verifica OTP (F5). PUBLIC. Il wizard lo chiama al load: se il cookie di
// sessione corrisponde a un OTP verificato per questo preventivo → niente OTP
// (ripresa sullo stesso dispositivo). Altrimenti il wizard mostra lo step OTP.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { OTP_COOKIE_PREFIX } from '@/lib/otp';

export const runtime = 'nodejs';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const uuid = params.uuid;

  const token = request.cookies.get(OTP_COOKIE_PREFIX + uuid)?.value || '';
  if (!token) return NextResponse.json({ verified: false }, { headers });

  const { data: row } = await supabaseAdmin
    .from('email_otp')
    .select('id')
    .eq('quote_uuid', uuid)
    .eq('session_token', token)
    .not('verified_at', 'is', null)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ verified: !!row }, { headers });
}
