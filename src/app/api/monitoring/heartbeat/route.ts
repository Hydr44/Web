import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

function createCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST,OPTIONS",
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

// Verifica token OAuth
function verifyOAuthToken(token: string) {
  try {
    const secret =
      process.env.JWT_SECRET || "desktop_oauth_secret_key_change_in_production";
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

/**
 * POST /api/monitoring/heartbeat
 * Registra heartbeat dall'app desktop
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    // Verifica autenticazione
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return corsJson(origin, { error: "Unauthorized" }, 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyOAuthToken(token) as any;

    if (!decoded?.user_id) {
      return corsJson(origin, { error: "Invalid token" }, 401);
    }

    const body = await request.json();
    const { org_id, app_version } = body;

    if (!org_id) {
      return corsJson(origin, { error: "org_id required" }, 400);
    }

    // Verifica membership org
    const { data: member, error: memberError } = await supabaseAdmin
      .from("org_members")
      .select("org_id")
      .eq("org_id", org_id)
      .eq("user_id", decoded.user_id)
      .maybeSingle();

    if (memberError || !member) {
      return corsJson(origin, { error: "Not authorized for this org" }, 403);
    }

    // Delete vecchio heartbeat e inserisci nuovo (user_id non è PK)
    const { error: deleteError } = await supabaseAdmin
      .from("app_heartbeats")
      .delete()
      .eq("user_id", decoded.user_id);

    if (deleteError) {
      console.error("Heartbeat delete error:", deleteError);
    }

    // Insert nuovo heartbeat
    const { error } = await supabaseAdmin.from("app_heartbeats").insert({
      user_id: decoded.user_id,
      org_id: org_id,
      app_version: app_version || "unknown",
      online: true,
      last_seen: new Date().toISOString(),
    });

    if (error) {
      console.error("Heartbeat error:", error);
      return corsJson(origin, { error: "Failed to save heartbeat" }, 500);
    }

    return corsJson(
      origin,
      {
        success: true,
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    console.error("Heartbeat endpoint error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return corsJson(
      origin,
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}

