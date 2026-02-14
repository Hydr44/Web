import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

function timingSafeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyWebhookHmac(rawBody: string, headerHmac: string) {
  const digest = crypto
    .createHmac("sha256", SHOPIFY_CLIENT_SECRET as string)
    .update(rawBody, "utf8")
    .digest("base64");
  return timingSafeEqual(digest, headerHmac);
}

export async function POST(req: NextRequest) {
  try {
    if (!SHOPIFY_CLIENT_SECRET) {
      return new NextResponse("Missing SHOPIFY_CLIENT_SECRET", { status: 500 });
    }

    const hmac = req.headers.get("x-shopify-hmac-sha256") || "";
    const shopDomain = (req.headers.get("x-shopify-shop-domain") || "").toLowerCase();

    if (!hmac || !shopDomain) {
      return new NextResponse("Missing headers", { status: 400 });
    }

    const raw = await req.text();
    if (!verifyWebhookHmac(raw, hmac)) {
      return new NextResponse("Invalid HMAC", { status: 401 });
    }

    const now = new Date().toISOString();

    // Disabilita connessione Shopify associata a quello shop
    // (oggi salviamo shop_domain dentro credentials)
    const { data: rows, error: findErr } = await supabaseAdmin
      .from("marketplace_connections")
      .select("id, org_id, credentials")
      .eq("platform", "shopify")
      .contains("credentials", { shop_domain: shopDomain });

    if (findErr) {
      console.error("[shopify webhook] find error:", findErr);
      return new NextResponse("DB error", { status: 500 });
    }

    if (rows && rows.length > 0) {
      for (const row of rows) {
        const newCreds = { ...(row as any).credentials };
        if (newCreds?.access_token) delete newCreds.access_token;

        const { error: updErr } = await supabaseAdmin
          .from("marketplace_connections")
          .update({
            status: "disconnected",
            credentials: newCreds,
            last_error: "app_uninstalled",
            updated_at: now,
          })
          .eq("id", row.id);

        if (updErr) {
          console.error("[shopify webhook] update error:", updErr);
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("[shopify webhook] error:", e);
    return new NextResponse("Internal error", { status: 500 });
  }
}
