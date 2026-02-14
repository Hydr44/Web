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
    const topic = (req.headers.get("x-shopify-topic") || "").toLowerCase();
    const shopDomain = (req.headers.get("x-shopify-shop-domain") || "").toLowerCase();

    console.log("[shopify compliance] incoming", { topic, shopDomain, hasHmac: Boolean(hmac) });

    if (!hmac) {
      return new NextResponse("Missing HMAC", { status: 400 });
    }

    const raw = await req.text();
    if (!verifyWebhookHmac(raw, hmac)) {
      console.warn("[shopify compliance] invalid hmac", { topic, shopDomain });
      return new NextResponse("Invalid HMAC", { status: 401 });
    }

    // Smista in base al topic
    switch (topic) {
      case "customers/data_request":
        console.log("[shopify compliance] customers/data_request OK", { shopDomain });
        // Non memorizziamo PII cliente Shopify: rispondiamo OK.
        break;

      case "customers/redact":
        console.log("[shopify compliance] customers/redact OK", { shopDomain });
        // Non memorizziamo PII cliente Shopify: rispondiamo OK.
        break;

      case "shop/redact":
        console.log("[shopify compliance] shop/redact", { shopDomain });
        // Disconnetti lo shop se presente
        if (shopDomain) {
          try {
            const { data: rows } = await supabaseAdmin
              .from("marketplace_connections")
              .select("id")
              .eq("platform", "shopify")
              .contains("credentials", { shop_domain: shopDomain });

            if (rows?.length) {
              for (const row of rows) {
                await supabaseAdmin
                  .from("marketplace_connections")
                  .update({
                    status: "disconnected",
                    credentials: {},
                    last_error: "shop_redact",
                  })
                  .eq("id", row.id);
              }
            }
          } catch (e) {
            console.error("[shopify compliance] shop/redact cleanup error", e);
          }
        }
        break;

      default:
        console.warn("[shopify compliance] unknown topic", { topic });
        break;
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("[shopify compliance] error:", e);
    return new NextResponse("Internal error", { status: 500 });
  }
}
