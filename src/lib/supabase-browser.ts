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
    }
  );