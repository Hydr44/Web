import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware: gestisce solo CORS per le API staff e redirect del subdominio staff.
 * La manutenzione del sito web è gestita nel root layout.tsx (Server Component, Node.js runtime).
 */
export function middleware(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/staff/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
