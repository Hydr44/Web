// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Client ADMIN (service role) — SOLO lato server / route handlers.
 * Usiamolo per webhook, job, sync… mai esporre la chiave nel client.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false, // nessun cookie/localStorage
      autoRefreshToken: false,
    },
  }
);