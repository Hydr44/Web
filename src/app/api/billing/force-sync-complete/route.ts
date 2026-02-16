// src/app/api/billing/force-sync-complete/route.ts - Sincronizzazione completa e robusta
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
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

    console.log(`🔄 Force sync complete for user: ${user.email}`);

    // Cerca tutti i customer per questo utente
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 10,
    });

    console.log(`Found ${customers.data.length} customers for ${user.email}`);

    let activeSubscription = null;
    let activeCustomer = null;

    // Cerca subscription attive tra tutti i customer
    for (const customer of customers.data) {
      console.log(`🔍 Checking customer: ${customer.id}`);
      
      // Cerca tutte le subscription (non solo active)
      const allSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });
      
      console.log(`Found ${allSubscriptions.data.length} subscriptions for customer ${customer.id}`);
      
      // Cerca subscription attive
      const activeSubscriptions = allSubscriptions.data.filter(sub => sub.status === 'active');
      console.log(`Active subscriptions: ${activeSubscriptions.length}`);
      
      if (activeSubscriptions.length > 0) {
        activeSubscription = activeSubscriptions[0];
        activeCustomer = customer;
        console.log(`✅ Found active subscription: ${activeSubscription.id} for customer: ${customer.id}`);
        break;
      }
    }

    if (!activeSubscription || !activeCustomer) {
      return NextResponse.json(
        { ok: false, error: "no_active_subscription_found" },
        { status: 400 }
      );
    }

    const priceId = activeSubscription.items?.data?.[0]?.price?.id ?? null;
    const planName = PLAN_MAPPING[priceId || ""] || "Unknown";

    console.log(`📋 Syncing: ${planName} (${priceId}) for customer: ${activeCustomer.id}`);

    // Aggiorna tabella subscriptions
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          stripe_customer_id: activeCustomer.id,
          stripe_subscription_id: activeSubscription.id,
          price_id: priceId,
          status: activeSubscription.status,
          current_period_end: new Date(
            (activeSubscription.current_period_end ?? 0) * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    // Aggiorna profilo utente
    await supabaseAdmin
      .from("profiles")
      .update({
        current_plan: planName,
        stripe_customer_id: activeCustomer.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    console.log(`✅ Sync complete: ${planName} for user ${user.email}`);

    return NextResponse.json({ 
      ok: true, 
      plan: planName,
      customer_id: activeCustomer.id,
      subscription_id: activeSubscription.id,
      price_id: priceId
    });

  } catch (e: unknown) {
    console.error("force_sync_complete_error", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
