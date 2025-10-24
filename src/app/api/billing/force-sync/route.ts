// src/app/api/billing/force-sync/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    // Recupera il profilo utente
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { ok: false, error: "no_stripe_customer" },
        { status: 400 }
      );
    }

    // Recupera tutte le subscription attive per questo customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { ok: false, error: "no_active_subscription" },
        { status: 400 }
      );
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items?.data?.[0]?.price?.id ?? null;

    // Mappa price_id al nome del piano (stessa logica del webhook)
    const PLAN_MAPPING: Record<string, string> = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || ""]: "Starter",
      [process.env.STRIPE_PRICE_FLEET || ""]: "Flotta", 
      [process.env.STRIPE_PRICE_CONSORTIUM || ""]: "Azienda / Consorzio",
    };

    const planName = PLAN_MAPPING[priceId || ""] || "Unknown";

    // Aggiorna la tabella subscriptions
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          stripe_customer_id: profile.stripe_customer_id,
          stripe_subscription_id: subscription.id,
          price_id: priceId,
          status: subscription.status,
          current_period_end: new Date(
            (subscription.current_period_end ?? 0) * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    // Aggiorna il profilo utente con il piano corrente e customer ID
    await supabaseAdmin
      .from("profiles")
      .update({
        current_plan: planName,
        stripe_customer_id: subscription.customer as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ 
      ok: true, 
      plan: planName,
      subscription_id: subscription.id 
    });

  } catch (e: unknown) {
    console.error("force_sync_error", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
