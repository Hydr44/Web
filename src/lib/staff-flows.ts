/**
 * Staff auth flows — Fase 2 (backend).
 * Helper condivisi per: token invito/reset, OTP (staff_otp), dispositivi
 * fidati (staff_trusted_devices), "ticket OTP" (prova che lo step password è
 * stato superato), e le email transazionali (Resend).
 *
 * Protezioni durevoli (senza dipendere da Upstash):
 *  - OTP: staff_otp.attempts (max 5) + expires_at (10 min) + cooldown reinvio
 *  - Login: staff.failed_login_count + staff.locked_until (a DB)
 *
 * Ref: docs/specs/staff-auth-secure-redesign.md
 */
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from './supabase-admin';
import {
  generateOtpCode, hashCode, OTP_TTL_MS, OTP_MAX_ATTEMPTS, maskEmail,
} from './otp';
import { sendEmail } from './newsletter';
import { brandedHtml } from './email-template';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu';
const JWT_ISSUER = 'rescuemanager-admin';

export const STAFF_OTP_ENABLED = process.env.STAFF_OTP_ENABLED === 'true';

export const INVITE_TTL_MS = 48 * 3600 * 1000;      // 48 ore
export const DEVICE_TTL_DAYS = 7;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;    // 30s tra un OTP e il successivo
export const LOGIN_LOCK_THRESHOLD = 8;              // tentativi falliti prima del lock
export const LOGIN_LOCK_MS = 15 * 60 * 1000;        // 15 min di lock
export const DEVICE_COOKIE = 'rm_staff_device';

export const VALID_STAFF_ROLES = ['super_admin', 'admin', 'marketing', 'sales', 'support', 'staff'] as const;
export type StaffRole = (typeof VALID_STAFF_ROLES)[number];

// ── segreto (riusa quello dello staff JWT) ──────────────────────────────────
function staffSecret(): Uint8Array {
  const raw = process.env.STAFF_JWT_SECRET || process.env.ADMIN_SECRET_KEY;
  if (!raw) throw new Error('STAFF_JWT_SECRET (o ADMIN_SECRET_KEY) non configurata.');
  return new TextEncoder().encode(raw);
}

// ── token opachi (invito/reset/device): raw per email/cookie, hash a DB ─────
export function randomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
export function sha256(s: string): string {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

// ── "ticket OTP": prova, firmata e a breve scadenza, che il passo password è
//    stato superato per uno staff. NON è una sessione: serve solo a legare
//    login → otp/verify (impedisce di ottenere un token col solo codice). ───
export async function issueOtpTicket(staffId: string): Promise<string> {
  return new SignJWT({ purpose: 'otp_pending' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(staffId)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(staffSecret());
}
export async function verifyOtpTicket(ticket: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(ticket, staffSecret(), { issuer: JWT_ISSUER });
    if (payload.purpose !== 'otp_pending') return null;
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

// ── OTP (staff_otp) ─────────────────────────────────────────────────────────
type OtpPurpose = 'login' | 'password_reset' | 'email_verify';

/**
 * Genera e invia un OTP via email. Applica un cooldown di reinvio per non
 * spammare/brute-forzare l'invio. Ritorna { sent } e, se in cooldown, cooldown.
 */
export async function createAndSendOtp(
  staff: { id: string; email: string },
  purpose: OtpPurpose,
  ip: string | null,
): Promise<{ sent: boolean; cooldown?: boolean }> {
  const { data: recent } = await supabaseAdmin
    .from('staff_otp')
    .select('created_at')
    .eq('staff_id', staff.id)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent && Date.now() - new Date(recent.created_at).getTime() < OTP_RESEND_COOLDOWN_MS) {
    return { sent: false, cooldown: true };
  }

  const code = generateOtpCode();
  await supabaseAdmin.from('staff_otp').insert({
    staff_id: staff.id,
    purpose,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    ip_address: ip,
  });

  await sendOtpEmail(staff.email, code, purpose);
  return { sent: true };
}

/**
 * Verifica un OTP. Incrementa attempts sul fallimento (max 5), consuma sul
 * successo. Non rivela se lo staff esiste (chi chiama gestisce l'enumeration).
 */
export async function verifyOtp(
  staffId: string,
  purpose: OtpPurpose,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: rows } = await supabaseAdmin
    .from('staff_otp')
    .select('*')
    .eq('staff_id', staffId)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  const otp = rows?.[0];
  if (!otp) return { ok: false, error: 'Codice non valido o scaduto' };
  if (new Date(otp.expires_at).getTime() < Date.now()) return { ok: false, error: 'Codice scaduto' };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, error: 'Troppi tentativi: richiedi un nuovo codice' };

  // Confronto costante-tempo sugli hash
  const expected = otp.code_hash as string;
  const got = hashCode(String(code || '').trim());
  const match = expected.length === got.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));

  if (!match) {
    await supabaseAdmin.from('staff_otp').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
    return { ok: false, error: 'Codice non valido' };
  }

  // Consumo ATOMICO: WHERE consumed_at IS NULL così due richieste parallele con
  // lo stesso codice non lo consumano entrambe (no replay).
  const { data: consumed } = await supabaseAdmin
    .from('staff_otp')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', otp.id)
    .is('consumed_at', null)
    .select('id');
  if (!consumed || consumed.length === 0) {
    return { ok: false, error: 'Codice già utilizzato' };
  }
  return { ok: true };
}

// ── Dispositivi fidati (staff_trusted_devices) ──────────────────────────────
export async function issueTrustedDevice(staffId: string, ip: string | null, ua: string | null): Promise<string> {
  const token = randomToken();
  await supabaseAdmin.from('staff_trusted_devices').insert({
    staff_id: staffId,
    device_token_hash: sha256(token),
    ip_address: ip,
    user_agent: ua,
    last_used_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + DEVICE_TTL_DAYS * 86400000).toISOString(),
  });
  return token;
}

export async function isTrustedDevice(staffId: string, token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('staff_trusted_devices')
    .select('id')
    .eq('staff_id', staffId)
    .eq('device_token_hash', sha256(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!data) return false;
  await supabaseAdmin.from('staff_trusted_devices').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return true;
}

// ── Email transazionali (Resend, brandizzate) ───────────────────────────────
async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<boolean> {
  const map: Record<OtpPurpose, { subject: string; intro: string }> = {
    login: { subject: 'Codice di accesso — RescueManager Staff', intro: 'Ecco il codice per completare l\'accesso al pannello staff.' },
    password_reset: { subject: 'Codice reset password — RescueManager Staff', intro: 'Ecco il codice per reimpostare la tua password staff.' },
    email_verify: { subject: 'Verifica email — RescueManager Staff', intro: 'Ecco il codice per verificare la tua email.' },
  };
  const { subject, intro } = map[purpose];
  const html = brandedHtml(
    `${intro}\nInseriscilo entro 10 minuti. Se non hai richiesto tu questo codice, ignora questa email.`,
    { subtitle: 'RescueManager Staff', code, footerNote: 'Non condividere questo codice con nessuno.' },
  );
  return sendEmail(email, subject, html);
}

/** Notifica di sicurezza dopo un cambio password (alert reset non autorizzati). */
export async function sendPasswordChangedEmail(email: string): Promise<boolean> {
  const html = brandedHtml(
    `La password del tuo account staff RescueManager è appena stata modificata.\nSe sei stato tu, nessuna azione è necessaria.\nSe NON riconosci questa operazione, contatta subito un amministratore: il tuo account potrebbe essere compromesso.`,
    { subtitle: 'Password modificata', footerNote: 'Email automatica di sicurezza.' },
  );
  return sendEmail(email, 'La tua password staff è stata modificata', html);
}

export async function sendInviteEmail(email: string, rawToken: string, role: string): Promise<boolean> {
  const link = `${SITE}/staff/invito?token=${encodeURIComponent(rawToken)}`;
  const html = brandedHtml(
    `Sei stato invitato ad accedere al pannello staff di RescueManager con il ruolo "${role}".\nClicca il pulsante qui sotto per verificare la tua email e impostare la tua password.`,
    {
      subtitle: 'Invito staff',
      cta: { href: link, label: 'Attiva il tuo accesso' },
      footerNote: `Il link scade tra 48 ore. Se non ti aspettavi questo invito, ignora l'email. (${maskEmail(email)})`,
    },
  );
  return sendEmail(email, 'Invito staff — RescueManager', html);
}
