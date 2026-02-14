import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// Defaults per i flag (usati se non presenti nel DB)
const FLAG_DEFAULTS: Record<string, boolean> = {
  rentri_enabled: true,
  sdi_enabled: true,
  rvfu_enabled: false,
  spare_parts_enabled: true,
  yard_enabled: true,
  ai_validation: true,
  email_notifications: true,
  push_notifications: false,
  two_factor_auth: false,
  registration_open: true,
};

function createCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Vary"] = "Origin";
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

function corsJson(
  origin: string | null,
  body: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: createCorsHeaders(origin),
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(origin),
  });
}

/**
 * GET /api/feature-flags/status
 * Endpoint pubblico per la desktop app — restituisce i feature flags globali
 * Nessuna autenticazione richiesta (è un endpoint di sola lettura)
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "feature_flags")
      .single();

    if (error) {
      console.error("Error getting feature flags:", error);
      // In caso di errore, ritorna i defaults (fail-open)
      return corsJson(origin, { flags: FLAG_DEFAULTS }, 200);
    }

    const savedFlags: Record<string, boolean> =
      data?.value && typeof data.value === "object" ? data.value : {};

    // Merge: defaults + saved (saved ha priorità)
    const flags: Record<string, boolean> = { ...FLAG_DEFAULTS, ...savedFlags };

    return corsJson(origin, { flags }, 200);
  } catch (error) {
    console.error("Feature flags status error:", error);
    return corsJson(origin, { flags: FLAG_DEFAULTS }, 200);
  }
}
