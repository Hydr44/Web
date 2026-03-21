// src/lib/rate-limit.ts
/**
 * Simple in-memory rate limiter
 * Per produzione, usare Redis/Upstash per rate limiting distribuito
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup ogni 5 minuti
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Numero massimo di richieste */
  maxRequests: number;
  /** Finestra temporale in secondi */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Verifica rate limit per un identificatore
 * @param identifier - IP, user_id, o altra chiave univoca
 * @param config - Configurazione rate limit
 * @returns Risultato con success, remaining, reset
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  
  let entry = rateLimitStore.get(identifier);
  
  // Se non esiste o è scaduto, crea nuovo
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: entry.resetAt,
    };
  }
  
  // Incrementa contatore
  entry.count++;
  
  // Verifica se superato il limite
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetAt,
    };
  }
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Preset comuni per rate limiting
 */
export const RateLimitPresets = {
  /** Login: 5 tentativi ogni 15 minuti */
  LOGIN: { maxRequests: 5, windowSeconds: 15 * 60 },
  
  /** API generiche: 100 richieste al minuto */
  API: { maxRequests: 100, windowSeconds: 60 },
  
  /** Operazioni sensibili: 10 richieste ogni 5 minuti */
  SENSITIVE: { maxRequests: 10, windowSeconds: 5 * 60 },
  
  /** Contact form: 3 invii ogni ora */
  CONTACT: { maxRequests: 3, windowSeconds: 60 * 60 },
  
  /** Checkout: 5 tentativi ogni 10 minuti */
  CHECKOUT: { maxRequests: 5, windowSeconds: 10 * 60 },
};

/**
 * Ottiene identificatore da request (IP o user_id)
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  // Prova a ottenere IP da headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }
  
  return 'ip:unknown';
}

/**
 * Middleware helper per rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  config: RateLimitConfig
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getIdentifier(request);
    const result = checkRateLimit(identifier, config);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          limit: result.limit,
          reset: new Date(result.reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          },
        }
      );
    }
    
    const response = await handler(request);
    
    // Aggiungi headers rate limit alla risposta
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.reset));
    
    return response;
  };
}
