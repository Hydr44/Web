// src/lib/jwt-secure.ts
import jwt from 'jsonwebtoken';

/**
 * Ottiene il JWT secret in modo sicuro
 * Fail-fast se non configurato o troppo debole
 */
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      'SECURITY ERROR: JWT_SECRET environment variable must be configured. ' +
      'Generate a strong secret with: openssl rand -base64 64'
    );
  }
  
  if (secret.length < 32) {
    throw new Error(
      'SECURITY ERROR: JWT_SECRET must be at least 32 characters long. ' +
      'Current length: ' + secret.length
    );
  }
  
  return secret;
}

/**
 * Verifica un token JWT in modo sicuro
 * @param token - Token JWT da verificare
 * @returns Payload decodificato o null se invalido
 */
export function verifyJWT<T = any>(token: string): T | null {
  try {
    const secret = getJWTSecret();
    return jwt.verify(token, secret) as T;
  } catch (error) {
    // Log error per monitoring ma non esporre dettagli
    if (process.env.NODE_ENV === 'development') {
      console.error('[JWT] Verification failed:', error);
    }
    return null;
  }
}

/**
 * Crea un token JWT in modo sicuro
 * @param payload - Dati da includere nel token
 * @param expiresIn - Durata validità (default: 1h)
 * @returns Token JWT firmato
 */
export function signJWT(payload: object, expiresIn: string | number = '1h'): string {
  const secret = getJWTSecret();
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Type per payload OAuth standard
 */
export interface OAuthTokenPayload {
  user_id: string;
  type: 'access' | 'refresh';
  org_id?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verifica token OAuth con type checking
 */
export function verifyOAuthToken(token: string): OAuthTokenPayload | null {
  const payload = verifyJWT<OAuthTokenPayload>(token);
  
  if (!payload?.user_id || !payload?.type) {
    return null;
  }
  
  return payload;
}
