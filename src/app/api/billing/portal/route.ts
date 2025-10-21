// src/app/api/billing/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
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
    const returnPath = req.nextUrl.searchParams.get("return") || "/dashboard/billing";

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", "/dashboard/billing");
      return NextResponse.redirect(loginUrl, 302);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2024-06-20",
    });

    // Trova (o crea) il customer su Stripe partendo dall'email
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer =
      existing.data[0] ??
      (await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      }));

    const base = getBaseUrl(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${base}${returnPath}`,
    });

    return NextResponse.redirect(session.url, 303);
  } catch (e: any) {
    console.error("portal error", e);
    const msg = encodeURIComponent(e?.message ?? "portal_error");
    return NextResponse.redirect(new URL(`/dashboard/billing?err=${msg}`, req.url), 302);
  }
}
