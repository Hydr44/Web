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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = req.cookies.get(name);
            console.log(`Middleware getting cookie ${name}:`, cookie ? "EXISTS" : "NOT FOUND");
            if (cookie) {
              console.log(`Cookie ${name} value length:`, cookie.value?.length || 0);
            }
            if (!cookie) return undefined;
            return cookie.value;
          } catch (error) {
            console.warn(`Error getting cookie ${name}:`, error);
            return undefined;
          }
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  console.log("User in middleware:", user ? "EXISTS" : "NULL");
  console.log("User email in middleware:", user?.email || "NO USER");
  console.log("Auth error in middleware:", error?.message || "NO ERROR");

  const isProtected = req.nextUrl.pathname.startsWith("/dashboard");
  if (isProtected && (!user || error)) {
    console.log("Redirecting to login - no authenticated user");
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  console.log("Middleware: allowing access");
  return response;
}

export const config = { matcher: ["/dashboard/:path*"] };
