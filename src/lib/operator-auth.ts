// Utility per autenticazione operatori
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'operator_jwt_secret_change_in_production';
const JWT_ACCESS_EXPIRES = '7d'; // 7 giorni
const JWT_REFRESH_EXPIRES = '30d'; // 30 giorni

export interface OperatorTokenPayload {
  operator_id: string;
  org_id: string;
  user_id?: string;
  session_id: string;
  ruolo: 'operatore' | 'supervisore' | 'admin';
  permissions: string[];
  device_id: string;
  is_persistent: boolean;
  iat: number;
  exp: number;
  type: 'operator_access' | 'operator_refresh';
  version: 1;
}

/**
 * Genera hash SHA256 di un token (per salvare nel DB invece del token raw)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Genera access token JWT per operatore
 */
export function generateAccessToken(payload: Omit<OperatorTokenPayload, 'iat' | 'exp' | 'type' | 'version'>): string {
  return jwt.sign(
    {
      ...payload,
      type: 'operator_access',
      version: 1,
    },
    JWT_SECRET,
    {
      expiresIn: payload.is_persistent ? undefined : JWT_ACCESS_EXPIRES,
    }
  );
}

/**
 * Genera refresh token JWT per operatore
 */
export function generateRefreshToken(payload: Omit<OperatorTokenPayload, 'iat' | 'exp' | 'type' | 'version'>): string {
  return jwt.sign(
    {
      ...payload,
      type: 'operator_refresh',
      version: 1,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES,
    }
  );
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): OperatorTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as OperatorTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password con bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica password con bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Genera device fingerprint (semplificato, in produzione usare libreria dedicata)
 */
export function generateDeviceId(userAgent: string, ip?: string): string {
  const data = `${userAgent}|${ip || 'unknown'}|${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Calcola expires_at da token JWT
 */
export function getExpiresAt(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as OperatorTokenPayload;
    if (!decoded || !decoded.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}
