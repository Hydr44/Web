import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

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
    console.log("[shopify webhook customers/data_request] incoming", {
      shopDomain,
      hasHmac: Boolean(hmac),
    });
    if (!hmac) {
      return new NextResponse("Missing HMAC", { status: 400 });
    }

    const raw = await req.text();
    if (!verifyWebhookHmac(raw, hmac)) {
      console.warn("[shopify webhook customers/data_request] invalid hmac", { shopDomain });
      return new NextResponse("Invalid HMAC", { status: 401 });
    }

    // Per ora non persistiamo dati cliente Shopify: rispondiamo OK.
    // Se in futuro memorizziamo dati personali, qui va implementata l'estrazione/cancellazione.
    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("[shopify webhook customers/data_request] error:", e);
    return new NextResponse("Internal error", { status: 500 });
  }
}
