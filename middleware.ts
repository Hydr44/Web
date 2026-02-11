// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const hostname = req.headers.get('host') || '';
  const isStaffSubdomain = hostname.includes('staff.rescuemanager.eu') || hostname.includes('staff.localhost');

  // Handle staff subdomain routing
  if (isStaffSubdomain) {
    // Redirect staff root to login
    if (req.nextUrl.pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/staff/login';
      return NextResponse.redirect(url);
    }
    
    // Ensure all staff routes are prefixed correctly
    if (!req.nextUrl.pathname.startsWith('/staff')) {
      const url = req.nextUrl.clone();
      url.pathname = `/staff${req.nextUrl.pathname}`;
      return NextResponse.redirect(url);
    }
    
    // For staff subdomain, don't apply other middleware logic
    return response;
  }

  // Per ora, permettiamo l'accesso al dashboard senza controllo di autenticazione
  // Il controllo sarà fatto lato client
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard");
  if (isProtected) {
    return response;
  }
  
  return response;
}

export const config = { 
  matcher: [
    "/dashboard/:path*",
    "/staff/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ] 
};
