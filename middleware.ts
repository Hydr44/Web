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
  console.log("All cookies:", req.cookies.getAll().map(c => `${c.name}=${c.value?.substring(0, 20)}...`));

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

export const config = { matcher: ["/dashboard/:path*"] };
