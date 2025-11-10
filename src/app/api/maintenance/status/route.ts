import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

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
 * GET /api/maintenance/status
 * Verifica se l'app è in modalità manutenzione
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const { data, error } = await supabaseAdmin
      .from("maintenance_mode")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error getting maintenance status:", error);
      return corsJson(origin, { is_active: false, message: null }, 200);
    }

    return corsJson(
      origin,
      {
        is_active: data?.is_active || false,
        message: data?.message || null,
        started_at: data?.started_at || null,
      },
      200
    );
  } catch (error) {
    console.error("Maintenance status error:", error);
    return corsJson(origin, { is_active: false, message: null }, 200);
  }
}

