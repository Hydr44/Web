import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Middleware: CORS per /api/staff/*, AUTH per /api/staff/admin/*, redirect
 * del sotto-dominio staff. La manutenzione del sito web e' gestita nel root
 * layout.tsx (Server Component, Node.js runtime).
 *
 * AUTH: tutte le route admin (eccetto OPTIONS) richiedono un JWT staff
 * valido nell'header Authorization. La verifica usa `jose` (Edge-compatibile);
 * il check "staff.is_active" eventuale resta nelle route che gia' lo fanno
 * (qui ci limitiamo a firma+scadenza JWT). Senza questo middleware le 70+
 * route admin erano leggibili/scrivibili da chiunque conoscesse l'URL.
 */
// Niente fallback hardcoded: il vecchio 'staff-secret-change-me' era pubblico nel
// repo → chiunque poteva firmare JWT validi. Rimosso 2026-06-11.
// STAFF_JWT_SECRET (o ADMIN_SECRET_KEY alias legacy) DEVE essere settato nelle env
// Vercel prod + staging + preview perché l'auth staff funzioni.
// IMPORTANTE: il segreto si legge in modo LAZY e si fa **fail-closed** (nega
// l'accesso) se manca — NON un throw a livello-modulo. Il middleware gira su un
// matcher catch-all: un throw all'import butterebbe giù TUTTO il sito, non solo
// /api/staff. Fail-closed = route staff protette (401) e sito comunque su.
const JWT_ISSUER = 'rescuemanager-admin';

function getStaffSecret(): Uint8Array | null {
  const raw = process.env.STAFF_JWT_SECRET || process.env.ADMIN_SECRET_KEY;
  return raw ? new TextEncoder().encode(raw) : null;
}

async function isValidStaffJwt(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const secret = getStaffSecret();
  if (!secret) {
    // Segreto non configurato → nega (fail-closed) invece di crashare il sito.
    console.error('[middleware] STAFF_JWT_SECRET non configurata: accesso staff negato (fail-closed).');
    return false;
  }
  const token = authHeader.slice(7);
  try {
    await jwtVerify(token, secret, { issuer: JWT_ISSUER });
    return true;
  } catch {
    return false;
  }
}

function buildCorsHeaders(origin: string) {
  // Admin panel ora e' Electron desktop (origin `app://` in prod, `file://` o
  // localhost in dev). Sottodomini admin/staff dismessi a maggio 2026.
  const STAFF_ALLOWED_ORIGINS = [
    'https://rescuemanager.eu',
    'https://www.rescuemanager.eu',
    'https://staging.rescuemanager.eu',
  ];
  const isAllowed = STAFF_ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('app://');
  const corsOrigin = isAllowed ? origin : STAFF_ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Path che richiedono auth staff fuori dall'albero `/api/staff/admin/*`.
 * Il workflow security audit ha trovato cross-tenant leak su queste route:
 *   - /api/staff/leads/* e /api/staff/users/* (C3)
 *   - /api/staff/support/*, /api/staff/monitoring/*
 *   - /api/monitoring/users (C4)
 *   - /api/version/publish, /api/version/enforce (C5)
 *   - /api/sync/push (C7)
 * Da qui in poi tutte le mutation/leak vanno gate-ate.
 */
const STAFF_AUTH_PATHS = [
  '/api/staff/admin/',
  '/api/staff/leads/',
  '/api/staff/users/',
  '/api/staff/support/',
  '/api/staff/monitoring/',
  '/api/monitoring/users',
  '/api/version/publish',
  '/api/version/enforce',
  '/api/sync/push',
];

function requiresStaffAuth(pathname: string): boolean {
  return STAFF_AUTH_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pre-flight OPTIONS sempre senza auth (CORS preflight).
  if (
    request.method === 'OPTIONS' &&
    (pathname.startsWith('/api/staff/') || requiresStaffAuth(pathname))
  ) {
    const origin = request.headers.get('origin') || '';
    return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
  }

  // Auth gate per le route sensibili (sia /api/staff/admin/* che le altre
  // sopra elencate, prima esposte senza protezione).
  if (requiresStaffAuth(pathname)) {
    const origin = request.headers.get('origin') || '';
    const corsHeaders = buildCorsHeaders(origin);
    const authHeader = request.headers.get('authorization');
    const ok = await isValidStaffJwt(authHeader);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Non autorizzato' },
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const response = NextResponse.next();
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v);
    }
    return response;
  }

  // CORS-only sulle route staff non-auth (es. /api/staff/auth/login):
  // queste devono essere raggiungibili senza JWT, ma comunque con CORS.
  if (pathname.startsWith('/api/staff/')) {
    const origin = request.headers.get('origin') || '';
    const corsHeaders = buildCorsHeaders(origin);
    const response = NextResponse.next();
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/staff/:path*',
    '/api/monitoring/:path*',
    '/api/version/:path*',
    '/api/sync/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
