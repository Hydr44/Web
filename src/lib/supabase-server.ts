// src/lib/supabase-server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Per SSO tra sottodomini, impostiamo i cookie con:
 *  - domain: .rescuemanager.eu  (da env)
 *  - path: /
 *  - secure: true (in prod)
 *  - sameSite: "lax"
 *
 * Nota: in Next 15 si può scrivere i cookie SOLO in Route Handler o Server Action.
 * In Server Component la scrittura viene ignorata (e non va in errore).
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase non configurato: impostare NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Next consente set/delete SOLO in Route Handlers / Server Actions.
  // In Server Components esiste .set ma non effettua la scrittura: evitiamo errori runtime.
  const canWriteCookies = typeof (cookieStore as unknown as { set?: () => void }).set === "function";

  // Opzioni cookie coerenti tra set/remove
  const baseCookieOpts: Partial<CookieOptions> = {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          if (!canWriteCookies) return; // in Server Component non scriviamo
          cookieStore.set({
            name,
            value,
            ...baseCookieOpts,
            ...options,
            // garantiamo path/domain/secure coerenti
            path: baseCookieOpts.path,
            domain: baseCookieOpts.domain,
            secure: baseCookieOpts.secure,
            sameSite: baseCookieOpts.sameSite,
          });
        },
        remove: (name: string, options: CookieOptions) => {
          if (!canWriteCookies) return;
          cookieStore.delete({
            name,
            ...baseCookieOpts,
            ...options,
            path: baseCookieOpts.path,
            domain: baseCookieOpts.domain,
          });
        },
      },
    }
  );
}