/**
 * Pairing JWT helpers (server-side only).
 *
 * Firma e verifica i token JWT che permettono il pairing desktop→mobile via QR.
 * Mai esporre al client: il secret HMAC è in env `PAIRING_JWT_SECRET`.
 */

import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'rescuemanager-desktop';
const ALG = 'HS256';
const DEFAULT_EXP_SECONDS = 300; // 5 minuti

export interface PairingPrefill {
  name?: string;
  phone?: string;
  license_no?: string;
  license_expiry?: string; // ISO date (YYYY-MM-DD)
}

/**
 * Claim del nostro JWT. NON estendiamo `JWTPayload` di jose perché ha index
 * signature `[k: string]: unknown` che propaga `unknown` su `jti` e blocca
 * l'inferenza. Definiamo solo i campi che usiamo.
 */
export interface PairingTokenPayload {
  jti: string;
  org_id: string;
  operator_email: string;
  driver_id?: string;
  prefill?: PairingPrefill;
  // Standard JWT claims che jose imposta automaticamente
  iss?: string;
  iat?: number;
  exp?: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.PAIRING_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'PAIRING_JWT_SECRET env var mancante o troppo corto (min 32 chars). ' +
        'Genera con `openssl rand -base64 32` e settalo in Vercel.',
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Firma un pairing JWT con HMAC SHA-256.
 * @param payload  i claim del token (jti generato qui se non passato)
 * @param expSec   TTL in secondi (default 300 = 5min)
 */
export async function signPairingToken(
  payload: Omit<PairingTokenPayload, 'iss' | 'iat' | 'exp'>,
  expSec: number = DEFAULT_EXP_SECONDS,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expSec;

  return new SignJWT({
    org_id: payload.org_id,
    operator_email: payload.operator_email,
    driver_id: payload.driver_id,
    prefill: payload.prefill,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(payload.jti)
    .sign(getSecret());
}

/**
 * Verifica firma + scadenza + issuer. NON verifica `jti` single-use:
 * quello lo fa il caller controllando `pairing_tokens.used_at`.
 */
export async function verifyPairingToken(token: string): Promise<PairingTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    algorithms: [ALG],
  });
  return payload as unknown as PairingTokenPayload;
}

/**
 * Codifica il payload del QR come deep link `rescuemanager://`.
 * Il mobile lo riconosce e ne estrae automaticamente `token`.
 */
export function buildDeepLink(token: string): string {
  return `rescuemanager://pair?token=${encodeURIComponent(token)}`;
}
