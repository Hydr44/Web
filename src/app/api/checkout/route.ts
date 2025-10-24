// src/app/api/checkout/route.ts - Sistema checkout unificato e robusto
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Mappa price_id ai nomi dei piani
const PLAN_MAPPING: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || ""]: "Starter",
  [process.env.STRIPE_PRICE_FLEET || ""]: "Flotta", 
  [process.env.STRIPE_PRICE_CONSORTIUM || ""]: "Azienda / Consorzio",
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
    
    if (!priceId) {
      return NextResponse.redirect(
        new URL(`/dashboard/billing?err=missing_price`, req.url), 
        302
      );
    }

    // Verifica autenticazione
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const resume = `/api/checkout?price=${encodeURIComponent(priceId)}&return=${encodeURIComponent(returnUrl)}`;
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", resume);
      return NextResponse.redirect(loginUrl.toString(), 302);
    }

    // Verifica organizzazione
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_org, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.current_org) {
      return NextResponse.redirect(
        new URL(`/dashboard/billing?err=missing_org`, req.url), 
        302
      );
    }

    // Crea o recupera customer Stripe
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { 
          user_id: user.id, 
          org_id: profile.current_org 
        },
      });
      customerId = customer.id;
      
      // Salva customer_id nel profilo
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const baseUrl = getBaseUrl(req);
    
    // Crea checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { 
          user_id: user.id, 
          org_id: profile.current_org,
          plan_name: PLAN_MAPPING[priceId] || "Unknown"
        },
      },
      success_url: `${baseUrl}${returnUrl}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${returnUrl}?status=cancel`,
      metadata: { 
        user_id: user.id, 
        org_id: profile.current_org,
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
