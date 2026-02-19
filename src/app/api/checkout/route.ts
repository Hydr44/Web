// src/app/api/checkout/route.ts - Sistema checkout unificato e robusto
import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Mappa price_id ai nomi dei piani
const PLAN_MAPPING: Record<string, string> = {
  // Annuali
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || ""]: "Starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || ""]: "Professional",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL || ""]: "Business",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL || ""]: "Full",
  // Mensili
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || ""]: "Starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY || ""]: "Professional",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY || ""]: "Business",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY || ""]: "Full",
};

// Mappa product_id ai nomi dei piani (fallback per webhook)
const PRODUCT_MAPPING: Record<string, string> = {
  [process.env.STRIPE_PRODUCT_STARTER || ""]: "Starter",
  [process.env.STRIPE_PRODUCT_PROFESSIONAL || ""]: "Professional",
  [process.env.STRIPE_PRODUCT_BUSINESS || ""]: "Business",
  [process.env.STRIPE_PRODUCT_FULL || ""]: "Full",
};

function getBaseUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const priceId = req.nextUrl.searchParams.get("price");
    const returnUrl = req.nextUrl.searchParams.get("return") || "/dashboard/billing";
    const orgOverride = req.nextUrl.searchParams.get("org");

    if (!priceId) {
      return NextResponse.redirect(
        new URL(`/dashboard/billing?err=missing_price`, req.url),
        302
      );
    }

    const buildResumeUrl = () => {
      let u = `/api/checkout?price=${encodeURIComponent(priceId)}&return=${encodeURIComponent(returnUrl)}`;
      if (orgOverride) u += `&org=${encodeURIComponent(orgOverride)}`;
      return u;
    };

    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", buildResumeUrl());
      return NextResponse.redirect(loginUrl.toString(), 302);
    }

    let orgId: string | null = null;
    if (orgOverride) {
      const { data: member } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("org_id", orgOverride)
        .eq("user_id", user.id)
        .maybeSingle();
      if (member) orgId = member.org_id;
    }
    if (!orgId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_org")
        .eq("id", user.id)
        .single();
      orgId = profile?.current_org ?? null;
    }

    if (!orgId) {
      return NextResponse.redirect(
        new URL(`/dashboard/billing?err=missing_org`, req.url),
        302
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, org_id: orgId },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          user_id: user.id,
          org_id: orgId,
          plan_name: PLAN_MAPPING[priceId] || "Unknown"
        },
      },
      success_url: `${baseUrl}${returnUrl}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${returnUrl}?status=cancel`,
      metadata: {
        user_id: user.id,
        org_id: orgId,
        price_id: priceId
      },
    });

    if (!session.url) {
      return NextResponse.redirect(
        new URL(`/dashboard/billing?err=session_creation_failed`, req.url),
        302
      );
    }

    return NextResponse.redirect(session.url, 303);

  } catch (error) {
    console.error("Checkout error:", error);
    const errorMsg = encodeURIComponent((error as Error)?.message ?? "checkout_error");
    return NextResponse.redirect(
      new URL(`/dashboard/billing?err=${errorMsg}`, req.url),
      302
    );
  }
}
