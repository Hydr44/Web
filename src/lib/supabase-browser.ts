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
            return value ? decodeURIComponent(value) : undefined;
          } catch (error) {
            console.warn(`Error parsing cookie ${name}:`, error);
            return undefined;
          }
        },
        set(name: string, value: string, options: any) {
          if (typeof document === "undefined") return;
          try {
            document.cookie = `${name}=${encodeURIComponent(value)}; ${Object.entries(options)
              .map(([key, val]) => `${key}=${val}`)
              .join("; ")}`;
          } catch (error) {
            console.warn(`Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          if (typeof document === "undefined") return;
          try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options)
              .map(([key, val]) => `${key}=${val}`)
              .join("; ")}`;
          } catch (error) {
            console.warn(`Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );