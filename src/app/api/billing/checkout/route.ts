// src/app/api/billing/checkout/route.ts
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

function getBaseUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const price = req.nextUrl.searchParams.get("price") ?? "";
    const ret = req.nextUrl.searchParams.get("return") || "/dashboard/billing";
    if (!price) {
      return NextResponse.redirect(new URL(`/dashboard/billing?err=missing_price`, req.url), 302);
    }

    // 🔧 QUI: serve l'await
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const base = getBaseUrl(req);

    if (!user?.email) {
      const resume = `/api/billing/checkout?price=${encodeURIComponent(price)}&return=${encodeURIComponent(ret)}`;
      const loginUrl = new URL(`${base}/login`);
      loginUrl.searchParams.set("redirect", resume);
      return NextResponse.redirect(loginUrl.toString(), 302);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: user.email,
      allow_promotion_codes: true,
      success_url: `${base}${ret}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}${ret}?status=cancel`,
      metadata: { user_id: user.id },
    });

    if (!session.url) {
      return NextResponse.redirect(new URL(`/dashboard/billing?err=session_url`, req.url), 302);
    }

    return NextResponse.redirect(session.url, 303);
  } catch (e: any) {
    console.error("checkout_error", e);
    const msg = encodeURIComponent(e?.message ?? "checkout_error");
    return NextResponse.redirect(new URL(`/dashboard/billing?err=${msg}`, req.url), 302);
  }
}