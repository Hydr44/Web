import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_STATE_SECRET = process.env.SHOPIFY_STATE_SECRET;

function timingSafeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyShopifyOAuthHmac(url: URL): boolean {
  const receivedHmac = url.searchParams.get("hmac") || "";
  if (!receivedHmac) return false;

  // Shopify: HMAC = hex digest of sorted query params (excluding hmac, signature)
  const entries: Array<[string, string]> = [];
  for (const [k, v] of url.searchParams.entries()) {
    if (k === "hmac" || k === "signature") continue;
    entries.push([k, v]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));

  const message = entries.map(([k, v]) => `${k}=${v}`).join("&");
  const digest = crypto
    .createHmac("sha256", SHOPIFY_CLIENT_SECRET as string)
    .update(message)
    .digest("hex");

  return timingSafeEqual(digest, receivedHmac);
}

async function exchangeToken(params: { shop: string; code: string }) {
  const { shop, code } = params;

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify token exchange failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<{ access_token: string; scope: string }>;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  try {
    if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET || !SHOPIFY_STATE_SECRET) {
      return new NextResponse("Missing Shopify env", { status: 500 });
    }

    const error = url.searchParams.get("error");
    const error_description = url.searchParams.get("error_description");
    if (error) {
      return new NextResponse(`OAuth error: ${error_description || error}`, { status: 400 });
    }

    const shop = (url.searchParams.get("shop") || "").toLowerCase();
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";

    if (!shop || !code || !state) {
      return new NextResponse("Missing shop/code/state", { status: 400 });
    }

    if (!shop.endsWith(".myshopify.com")) {
      return new NextResponse("Invalid shop domain", { status: 400 });
    }

    if (!verifyShopifyOAuthHmac(url)) {
      return new NextResponse("Invalid HMAC", { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(state, SHOPIFY_STATE_SECRET);
    } catch {
      return new NextResponse("Invalid or expired state", { status: 401 });
    }

    if (decoded?.type !== "shopify_oauth_state" || !decoded?.org_id || !decoded?.user_id) {
      return new NextResponse("Invalid state payload", { status: 401 });
    }

    const org_id = decoded.org_id as string;
    const user_id = decoded.user_id as string;
    const return_to = typeof decoded.return_to === "string" ? decoded.return_to : null;

    const tokenData = await exchangeToken({ shop, code });

    const now = new Date().toISOString();
    const credentials = {
      shop_domain: shop,
      access_token: tokenData.access_token,
      scope: tokenData.scope,
      installed_at: now,
    };

    const { error: upsertError } = await supabaseAdmin
      .from("marketplace_connections")
      .upsert(
        {
          org_id,
          platform: "shopify",
          credentials,
          status: "connected",
          last_auth_at: now,
          last_error: null,
          updated_at: now,
          metadata: {
            user_id,
          },
        },
        { onConflict: "org_id,platform" }
      );

    if (upsertError) {
      console.error("[shopify callback] upsert error:", upsertError);
      return new NextResponse("Failed to persist connection", { status: 500 });
    }

    if (return_to) {
      const r = new URL(return_to);
      r.searchParams.set("oauth", "shopify");
      r.searchParams.set("connected", "1");
      r.searchParams.set("shop", shop);
      return NextResponse.redirect(r.toString());
    }

    return new NextResponse("Shopify connected", { status: 200 });
  } catch (e) {
    console.error("[shopify callback] error:", e);
    return new NextResponse("Internal error", { status: 500 });
  }
}
