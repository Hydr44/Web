// Guard server-side dell'OTP (F5). Il gate del wizard è solo lato client: le
// mutazioni post-verifica (visura/analyze, visura/submit) DEVONO provare che
// chi chiama ha verificato l'email del lead, altrimenti chi ha il link può
// saltare l'OTP via richiesta diretta. Verifica il cookie di sessione (impostato
// da otp/verify) contro la riga email_otp verificata.
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { OTP_COOKIE_PREFIX } from '@/lib/otp';

/** True se la richiesta porta un cookie OTP verificato per questo preventivo. */
export async function hasVerifiedOtp(request: NextRequest, uuid: string): Promise<boolean> {
  const token = request.cookies.get(OTP_COOKIE_PREFIX + uuid)?.value || '';
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('email_otp')
    .select('id')
    .eq('quote_uuid', uuid)
    .eq('session_token', token)
    .not('verified_at', 'is', null)
    .limit(1)
    .maybeSingle();
  return !!data;
}
