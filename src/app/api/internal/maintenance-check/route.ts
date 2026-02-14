import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/internal/maintenance-check
 * Endpoint interno usato dal middleware per verificare se il sito è in manutenzione.
 * Restituisce { enabled: boolean } senza CORS (solo uso interno).
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "website_maintenance_enabled")
      .single();

    if (error) {
      console.error("[maintenance-check] DB error:", error);
      return NextResponse.json({ enabled: false });
    }

    const enabled = data?.value === true || data?.value === "true";
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("[maintenance-check] Error:", error);
    return NextResponse.json({ enabled: false });
  }
}
