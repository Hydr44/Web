// src/lib/security.ts
/**
 * Security Service per Website (Next.js)
 * 
 * Features:
 * - Rate limiting per API routes
 * - Input sanitization e validation
 * - Password strength validation
 * - Audit logging
 * - CSRF protection
 * 
 * @author haxies
 * @created 2026-02-18
 */

import { supabaseAdmin } from './supabase-admin';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING (Server-side con Redis-like storage)
// ═══════════════════════════════════════════════════════════════

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiting per API endpoints
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  // Cleanup expired entries
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Ottiene identificatore unico per rate limiting
 */
export function getRateLimitIdentifier(
  req: Request,
  type: 'ip' | 'email' | 'combined' = 'ip',
  email?: string
): string {
  const ip = getClientIP(req);
  
  switch (type) {
    case 'ip':
      return ip;
    case 'email':
      return email || ip;
    case 'combined':
      return `${ip}:${email || 'anon'}`;
    default:
      return ip;
  }
}

/**
 * Ottiene IP del client
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// INPUT VALIDATION & SANITIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitizza input rimuovendo caratteri pericolosi
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Rimuovi tag HTML
    .replace(/javascript:/gi, '') // Rimuovi javascript:
    .replace(/on\w+=/gi, '') // Rimuovi event handlers
    .replace(/data:text\/html/gi, '') // Rimuovi data URLs
    .trim();
}

/**
 * Valida email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('Email è obbligatoria');
    return { valid: false, errors };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Formato email non valido');
  }
  
  if (email.length > 255) {
    errors.push('Email troppo lunga (max 255 caratteri)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || password.length === 0) {
    errors.push('Password è obbligatoria');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password deve essere di almeno 8 caratteri');
  }
  
  if (password.length > 128) {
    errors.push('Password troppo lunga (max 128 caratteri)');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password deve contenere almeno una lettera minuscola');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password deve contenere almeno una lettera maiuscola');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password deve contenere almeno un numero');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password deve contenere almeno un carattere speciale');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida nome/testo generico
 */
export function validateText(
  text: string,
  fieldName: string,
  minLength: number = 2,
  maxLength: number = 255
): ValidationResult {
  const errors: string[] = [];
  
  if (!text || text.trim().length === 0) {
    errors.push(`${fieldName} è obbligatorio`);
    return { valid: false, errors };
  }
  
  if (text.length < minLength) {
    errors.push(`${fieldName} deve essere di almeno ${minLength} caratteri`);
  }
  
  if (text.length > maxLength) {
    errors.push(`${fieldName} troppo lungo (max ${maxLength} caratteri)`);
  }
  
  // Check for suspicious patterns
  if (/<script|javascript:|on\w+=/i.test(text)) {
    errors.push(`${fieldName} contiene caratteri non validi`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida telefono
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phone || phone.trim().length === 0) {
    return { valid: true, errors }; // Phone is optional
  }
  
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Check if it's a valid phone number (basic check)
  if (!/^\+?[\d]{8,15}$/.test(cleaned)) {
    errors.push('Formato telefono non valido');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failed' | 'rate_limit_exceeded' | 'suspicious_activity' | 'api_call';
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log evento di sicurezza su Supabase
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await supabaseAdmin.from('security_audit_log').insert({
      event_type: event.type,
      user_id: event.user_id,
      email: event.email,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      metadata: event.metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Security] Failed to log event:', error);
    // Non bloccare l'operazione se il logging fallisce
  }
}

// ═══════════════════════════════════════════════════════════════
// CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Genera token CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica token CSRF
 */
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) return false;
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD HASHING (Server-side only)
// ═══════════════════════════════════════════════════════════════

/**
 * Hash password con bcrypt (usa bcryptjs per Node.js)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifica password hashata
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Genera ID sicuro
 */
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}
