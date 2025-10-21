// src/lib/supabase-browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client BROWSER per componenti client. Di default usa localStorage.
 * La condivisione SU SOTTODOMINI la garantiamo via cookie settati dal server.
 */
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookies: {
        get(name: string) {
          if (typeof document === "undefined") return undefined;
          try {
            const value = document.cookie
              .split("; ")
              .find((row) => row.startsWith(`${name}=`))
              ?.split("=")[1];
            console.log(`Getting cookie ${name}:`, value ? "EXISTS" : "NOT FOUND");
            return value ? decodeURIComponent(value) : undefined;
          } catch (error) {
            console.warn(`Error parsing cookie ${name}:`, error);
            return undefined;
          }
        },
        set(name: string, value: string, options: any) {
          if (typeof document === "undefined") return;
          try {
            // Configurazione cookie sicura per produzione
            const cookieOptions = {
              path: "/",
              secure: window.location.protocol === "https:",
              sameSite: "lax" as const,
              maxAge: 60 * 60 * 24 * 7, // 7 giorni
              ...options
            };
            
            const cookieString = `${name}=${encodeURIComponent(value)}; ${Object.entries(cookieOptions)
              .map(([key, val]) => `${key}=${val}`)
              .join("; ")}`;
            console.log(`Setting cookie ${name}:`, cookieString);
            document.cookie = cookieString;
            
            // Verifica che il cookie sia stato salvato
            setTimeout(() => {
              const saved = document.cookie.includes(`${name}=`);
              console.log(`Cookie ${name} saved:`, saved ? "YES" : "NO");
            }, 100);
          } catch (error) {
            console.warn(`Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          if (typeof document === "undefined") return;
          try {
            const cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options)
              .map(([key, val]) => `${key}=${val}`)
              .join("; ")}`;
            console.log(`Removing cookie ${name}:`, cookieString);
            document.cookie = cookieString;
          } catch (error) {
            console.warn(`Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );