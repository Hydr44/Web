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

    // Recupera l'organizzazione corrente dell'utente
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_org, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const orgId = profile?.current_org as string | undefined;
    if (!orgId) {
      return NextResponse.redirect(new URL(`/dashboard/billing?err=missing_org`, base), 302);
    }

    // Crea o recupera il customer Stripe
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, org_id: orgId },
      });
      customerId = customer.id;
      
      // Salva il customer_id nel profilo
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      // Propaga org_id anche nella Subscription generata da Stripe
      subscription_data: {
        metadata: { org_id: orgId, user_id: user.id },
      },
      success_url: `${base}${ret}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}${ret}?status=cancel`,
      metadata: { user_id: user.id, org_id: orgId },
    });

    if (!session.url) {
      return NextResponse.redirect(new URL(`/dashboard/billing?err=session_url`, req.url), 302);
    }

    return NextResponse.redirect(session.url, 303);
  } catch (e: unknown) {
    console.error("checkout_error", e);
    const msg = encodeURIComponent((e as Error)?.message ?? "checkout_error");
    return NextResponse.redirect(new URL(`/dashboard/billing?err=${msg}`, req.url), 302);
  }
}
