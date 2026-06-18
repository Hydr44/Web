// Helper OTP email (F5). Codice 6 cifre, hash SHA-256 (mai in chiaro a DB),
// token sessione per la ripresa, masking email.
import crypto from 'crypto';

export function generateOtpCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

export function randomSessionToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/** t***@example.com */
export function maskEmail(email: string): string {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return email || '';
  const u = user.length <= 1 ? user : user[0] + '***';
  return `${u}@${domain}`;
}

export const OTP_TTL_MS = 10 * 60 * 1000;     // 10 minuti
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_COOKIE_PREFIX = 'rm_otp_';
export const OTP_COOKIE_MAX_AGE = 7 * 24 * 3600; // 7 giorni
