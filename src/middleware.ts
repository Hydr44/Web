import { NextRequest, NextResponse } from 'next/server';

// Cache in-memory per evitare query DB su ogni richiesta (TTL 30 secondi)
let maintenanceCache: { enabled: boolean; checkedAt: number } | null = null;
const CACHE_TTL = 30_000; // 30 secondi

async function isWebsiteMaintenanceEnabled(): Promise<boolean> {
  // Usa cache se ancora valida
  if (maintenanceCache && Date.now() - maintenanceCache.checkedAt < CACHE_TTL) {
    return maintenanceCache.enabled;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) return false;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?key=eq.website_maintenance_enabled&select=value`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      maintenanceCache = { enabled: false, checkedAt: Date.now() };
      return false;
    }

    const rows = await res.json();
    const enabled = rows?.[0]?.value === true || rows?.[0]?.value === 'true';

    maintenanceCache = { enabled, checkedAt: Date.now() };
    return enabled;
  } catch {
    // In caso di errore, non bloccare il sito
    maintenanceCache = { enabled: false, checkedAt: Date.now() };
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS for staff admin API routes (admin panel calls from different origin)
  if (pathname.startsWith('/api/staff/')) {
    // Handle preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For actual requests, clone the response and add CORS headers
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  // Staff subdomain redirect (existing logic)
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

  // === Website maintenance check ===
  // Escludi route che non devono essere bloccate:
  // - /api/* (tutte le API devono restare accessibili)
  // - /staff/* (pannello staff deve restare accessibile)
  // - /maintenance (la pagina stessa di manutenzione)
  // - static assets
  const isExcluded =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/staff') ||
    pathname === '/maintenance' ||
    pathname.startsWith('/_next/') ||
    pathname.includes('favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg');

  if (!isExcluded) {
    const maintenanceOn = await isWebsiteMaintenanceEnabled();
    if (maintenanceOn) {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.rewrite(url);
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
