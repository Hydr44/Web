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
const STAFF_JWT_SECRET = new TextEncoder().encode(
  process.env.STAFF_JWT_SECRET || process.env.ADMIN_SECRET_KEY || 'staff-secret-change-me'
);
const JWT_ISSUER = 'rescuemanager-admin';

async function isValidStaffJwt(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    await jwtVerify(token, STAFF_JWT_SECRET, { issuer: JWT_ISSUER });
    return true;
  } catch {
    return false;
  }
}

function buildCorsHeaders(origin: string) {
  const STAFF_ALLOWED_ORIGINS = [
    'https://admin.rescuemanager.eu',
    'https://staff.rescuemanager.eu',
    'https://staging.rescuemanager.eu',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:3001',
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/staff/')) {
    const origin = request.headers.get('origin') || '';
    const corsHeaders = buildCorsHeaders(origin);

    // Preflight OPTIONS: rispondi senza auth check
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    // AUTH ENFORCEMENT per tutte le route admin (eccetto auth/login che e'
    // sotto /api/staff/auth/, fuori da /api/staff/admin/)
    if (pathname.startsWith('/api/staff/admin/')) {
      const authHeader = request.headers.get('authorization');
      const ok = await isValidStaffJwt(authHeader);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Non autorizzato' },
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Aggiungi CORS alla risposta normale
    const response = NextResponse.next();
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v);
    }
    return response;
  }

  // Staff subdomain redirect (logica esistente)
  const hostname = request.headers.get('host') || '';
  if (hostname.includes('staff.rescuemanager.eu') || hostname.includes('staff.localhost')) {
    const url = request.nextUrl.clone();
    if (url.pathname === '/') {
      url.pathname = '/staff';
      return NextResponse.redirect(url);
    }
    if (!url.pathname.startsWith('/staff')) {
      url.pathname = `/staff${url.pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/staff/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
