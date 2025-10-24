// src/app/api/billing/test-sync/route.ts - Test diretto della subscription
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
    console.log("🧪 Test sync API called");
    
    const supabase = await supabaseServer();
    console.log("✅ Supabase client created");
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("🔐 Auth check:", { user: user?.email, error: authError?.message });

    if (authError || !user) {
      console.error("❌ Auth failed:", authError);
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    console.log(`🧪 Test sync for user: ${user.email}`);

    // Test diretto con la subscription ID che vediamo nel debug
    const subscriptionId = "sub_1SLqetINO7pl3frNtcvJxsOQ";
    
    try {
      console.log(`🔍 Retrieving subscription: ${subscriptionId}`);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log(`📋 Subscription details:`, {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer,
        price_id: subscription.items?.data?.[0]?.price?.id,
        current_period_end: subscription.current_period_end
      });

      const customerId = subscription.customer as string;
      const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
      const planName = PLAN_MAPPING[priceId || ""] || "Unknown";

      console.log(`🔄 Syncing: ${planName} (${priceId}) for customer: ${customerId}`);

      // Aggiorna tabella subscriptions
      console.log("📝 Updating subscriptions table...");
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_id: user.id,
            stripe_customer_id: customerId,
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

      if (subError) {
        console.error("❌ Subscription update error:", subError);
        return NextResponse.json({ ok: false, error: subError.message }, { status: 500 });
      }
      console.log("✅ Subscriptions table updated");

      // Aggiorna profilo utente
      console.log("👤 Updating profiles table...");
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          current_plan: planName,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("❌ Profile update error:", profileError);
        return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
      }
      console.log("✅ Profiles table updated");

      console.log(`✅ Test sync complete: ${planName} for user ${user.email}`);

      return NextResponse.json({ 
        ok: true, 
        plan: planName,
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: priceId
      });

    } catch (stripeError) {
      console.error("❌ Stripe error:", stripeError);
      return NextResponse.json({ 
        ok: false, 
        error: `Stripe error: ${(stripeError as Error).message}` 
      }, { status: 500 });
    }

  } catch (e: unknown) {
    console.error("test_sync_error", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
