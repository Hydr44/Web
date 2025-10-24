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

  console.log("=== MIDDLEWARE DEBUG ===");
  console.log("Request URL:", req.url);
  console.log("Request pathname:", req.nextUrl.pathname);
  console.log("Host:", req.headers.get('host'));
  console.log("All cookies:", req.cookies.getAll().map(c => `${c.name}=${c.value?.substring(0, 20)}...`));

  const hostname = req.headers.get('host') || '';
  const isStaffSubdomain = hostname.includes('staff.rescuemanager.eu') || hostname.includes('staff.localhost');

  // Handle staff subdomain routing
  if (isStaffSubdomain) {
    console.log("Staff subdomain detected:", hostname);
    console.log("Request pathname:", req.nextUrl.pathname);
    
    // Redirect staff root to login
    if (req.nextUrl.pathname === '/') {
      console.log("Redirecting staff root to login");
      const url = req.nextUrl.clone();
      url.pathname = '/staff/login';
      return NextResponse.redirect(url);
    }
    
    // Ensure all staff routes are prefixed correctly
    if (!req.nextUrl.pathname.startsWith('/staff')) {
      console.log("Redirecting to staff route:", req.nextUrl.pathname);
      const url = req.nextUrl.clone();
      url.pathname = `/staff${req.nextUrl.pathname}`;
      return NextResponse.redirect(url);
    }
    
    // For staff subdomain, don't apply other middleware logic
    console.log("Staff subdomain - allowing through");
    return response;
  }

  // Per ora, permettiamo l'accesso al dashboard senza controllo di autenticazione
  // Il controllo sarà fatto lato client
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard");
  if (isProtected) {
    console.log("Dashboard access - allowing through (client-side auth check)");
    return response;
  }
  
  console.log("Middleware: allowing access");
  return response;
}

export const config = { 
  matcher: [
    "/dashboard/:path*",
    "/staff/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ] 
};
