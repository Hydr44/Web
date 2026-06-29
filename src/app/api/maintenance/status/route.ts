import { NextRequest, NextResponse } from "next/server";
import { readMaintenance } from "@/lib/maintenance";

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
    const status = await readMaintenance();
    // Ritorna stato calcolato (state) + is_active per retro-compat con la
    // desktop app già in produzione (MaintenanceOverlay legge is_active).
    return corsJson(origin, { ...status }, 200);
  } catch (error) {
    console.error("Maintenance status error:", error);
    return corsJson(origin, { state: "none", is_active: false, message: null }, 200);
  }
}

