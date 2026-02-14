import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const SHOPIFY_STATE_SECRET = process.env.SHOPIFY_STATE_SECRET;

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...(origin ? { Vary: "Origin" } : {}),
  } as Record<string, string>;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders(req.headers.get("origin")) });
}

/**
 * POST /api/auth/oauth/shopify/state
 * Header: Authorization: Bearer <supabase_access_token>
 * Body: { org_id: string, return_to?: string }
 * Returns: { state: string }
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    if (!SHOPIFY_STATE_SECRET) {
      return NextResponse.json({ error: "Missing SHOPIFY_STATE_SECRET" }, { status: 500, headers: corsHeaders(origin) });
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401, headers: corsHeaders(origin) });
    }

    const { org_id, return_to } = await req.json();
    if (!org_id) {
      return NextResponse.json({ error: "Missing org_id" }, { status: 400, headers: corsHeaders(origin) });
    }

    // allowlist return_to per evitare open redirect
    let safeReturnTo: string | null = null;
    if (return_to) {
      const r = String(return_to);
      const ok =
        r.startsWith("https://rescuemanager.eu/") ||
        r.startsWith("http://localhost:") ||
        r.startsWith("http://127.0.0.1:");
      if (!ok) {
        return NextResponse.json({ error: "Invalid return_to" }, { status: 400, headers: corsHeaders(origin) });
      }
      safeReturnTo = r;
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders(origin) });
    }

    const user_id = userData.user.id;

    const { data: membership, error: mErr } = await supabaseAdmin
      .from("org_members")
      .select("org_id")
      .eq("org_id", org_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (mErr || !membership) {
      return NextResponse.json({ error: "Not a member of org" }, { status: 403, headers: corsHeaders(origin) });
    }

    const state = jwt.sign(
      {
        org_id,
        user_id,
        type: "shopify_oauth_state",
        ...(safeReturnTo ? { return_to: safeReturnTo } : {}),
        nonce: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      },
      SHOPIFY_STATE_SECRET,
      { expiresIn: "10m" }
    );

    return NextResponse.json({ state }, { status: 200, headers: corsHeaders(origin) });
  } catch (e) {
    console.error("[shopify state] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders(origin) });
  }
}
