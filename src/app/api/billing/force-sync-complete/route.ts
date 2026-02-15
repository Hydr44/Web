// src/app/api/billing/force-sync-complete/route.ts - Sincronizzazione completa e robusta
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Mappa price_id ai nomi dei piani (deve corrispondere al webhook)
const PLAN_MAPPING: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || ""]: "Starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || ""]: "Starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || ""]: "Professional",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY || ""]: "Professional",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL || ""]: "Business",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY || ""]: "Business",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL || ""]: "Full",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY || ""]: "Full",
};

const PLAN_MODULES: Record<string, string[]> = {
  Starter: ["sdi"],
  Professional: ["sdi", "rvfu"],
  Business: ["sdi", "rvfu", "rentri"],
  Full: ["sdi", "rvfu", "rentri"],
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

    // Recupera org_id dell'utente
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("current_org")
      .eq("id", user.id)
      .single();

    const orgId = profile?.current_org ?? (activeCustomer.metadata as Record<string, string>)?.org_id ?? null;

    console.log(`📋 Syncing: ${planName} (${priceId}) for customer: ${activeCustomer.id}, org: ${orgId}`);

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

    // Sincronizza org_subscriptions e org_modules per l'organizzazione
    if (orgId) {
      const periodEndIso = new Date((activeSubscription.current_period_end ?? 0) * 1000).toISOString();
      await supabaseAdmin.from("org_subscriptions").upsert(
        {
          org_id: orgId,
          plan: planName,
          status: activeSubscription.status,
          stripe_customer_id: activeCustomer.id,
          stripe_subscription_id: activeSubscription.id,
          current_period_end: periodEndIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_id" }
      );

      const modulesToActivate = PLAN_MODULES[planName] || [];
      const now = new Date().toISOString();
      for (const mod of modulesToActivate) {
        await supabaseAdmin.from("org_modules").upsert(
          {
            org_id: orgId,
            module: mod,
            status: "active",
            activated_at: now,
            expires_at: null,
            updated_at: now,
          },
          { onConflict: "org_id,module" }
        );
      }
    }

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
