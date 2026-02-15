// src/app/api/webhooks/stripe/route.ts - Webhook Stripe unificato e completo
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

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

// Mappa product_id ai nomi dei piani (fallback)
const PRODUCT_MAPPING: Record<string, string> = {
  [process.env.STRIPE_PRODUCT_STARTER || ""]: "Starter",
  [process.env.STRIPE_PRODUCT_PROFESSIONAL || ""]: "Professional",
  [process.env.STRIPE_PRODUCT_BUSINESS || ""]: "Business",
  [process.env.STRIPE_PRODUCT_FULL || ""]: "Full",
};

async function updateUserSubscription(params: {
  userId: string;
  orgId: string | null;
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  status: string;
  currentPeriodEnd: number;
}) {
  const { userId, orgId: orgIdParam, customerId, subscriptionId, priceId, status, currentPeriodEnd } = params;
  
  // Cerca prima per price_id, poi per product_id come fallback
  let planName = PLAN_MAPPING[priceId || ""] || "Unknown";
  if (planName === "Unknown" && priceId) {
    // Prova a risolvere via Stripe API recuperando il product dal price
    try {
      const price = await stripe.prices.retrieve(priceId);
      const productId = typeof price.product === 'string' ? price.product : (price.product as any)?.id;
      if (productId && PRODUCT_MAPPING[productId]) {
        planName = PRODUCT_MAPPING[productId];
      }
    } catch (e) {
      console.error("Error resolving plan from price:", e);
    }
  }

  // Aggiorna tabella subscriptions
  await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        price_id: priceId,
        status: status,
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  // Aggiorna profilo utente con piano corrente
  await supabaseAdmin
    .from("profiles")
    .update({
      current_plan: planName,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Risolvi org_id se non passato (da profile.current_org)
  let orgId = orgIdParam;
  if (!orgId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("current_org")
      .eq("id", userId)
      .single();
    orgId = profile?.current_org ?? null;
  }

  // Sincronizza org_subscriptions e org_modules per l'organizzazione
  if (orgId) {
    await syncOrgSubscriptionAndModules({
      userId,
      orgId,
      planName,
      status,
      customerId,
      subscriptionId,
      currentPeriodEnd,
    });
  }

  console.log(`✅ Subscription updated for user ${userId}: ${planName} (${status})`);
}

// Moduli per piano (ordine default: sdi, rvfu, rentri — "a scelta" usa i primi N)
const PLAN_MODULES: Record<string, string[]> = {
  Starter: ["sdi"],
  Professional: ["sdi", "rvfu"],
  Business: ["sdi", "rvfu", "rentri"],
  Full: ["sdi", "rvfu", "rentri"],
};

async function syncOrgSubscriptionAndModules(params: {
  userId: string;
  orgId: string;
  planName: string;
  status: string;
  customerId: string;
  subscriptionId: string;
  currentPeriodEnd: number;
}) {
  const { orgId, planName, status, customerId, subscriptionId, currentPeriodEnd } = params;
  if (!orgId) return;

  // 1. Upsert org_subscriptions
  const periodEndIso = new Date(currentPeriodEnd * 1000).toISOString();
  await supabaseAdmin.from("org_subscriptions").upsert(
    {
      org_id: orgId,
      plan: planName,
      status: status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: periodEndIso,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" }
  );

  // 2. Aggiorna org_modules in base al piano (solo se status active o trialing)
  if (status !== "active" && status !== "trialing") return;

  const modulesToActivate = PLAN_MODULES[planName] || [];
  const now = new Date().toISOString();

  // Rimuovi moduli che non sono più nel piano
  const { data: existing } = await supabaseAdmin
    .from("org_modules")
    .select("module")
    .eq("org_id", orgId);

  const toRemove = (existing || [])
    .filter((m) => m.module !== "base" && !modulesToActivate.includes(m.module))
    .map((m) => m.module);

  for (const mod of toRemove) {
    await supabaseAdmin.from("org_modules").delete().eq("org_id", orgId).eq("module", mod);
  }

  // Inserisci/aggiorna moduli del piano
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

  console.log(`✅ org_subscriptions + org_modules synced for org ${orgId}: ${planName}`);
}

async function findUserByCustomerId(customerId: string): Promise<string | null> {
  // Prima prova a trovare per customer_id
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profile?.id) {
    return profile.id;
  }

  // Se non trovato, prova a recuperare il customer da Stripe e cercare per metadata
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && typeof customer === 'object' && customer.metadata?.user_id) {
      return customer.metadata.user_id;
    }
  } catch (error) {
    console.error("Error retrieving customer from Stripe:", error);
  }

  return null;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (err: unknown) {
    console.error("⚠️ Webhook signature verification failed:", (err as Error)?.message);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`🔔 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      // Checkout completato
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const userId = session.metadata?.user_id;

        if (!subscriptionId || !customerId) {
          console.error("Missing subscription or customer ID in checkout.session.completed");
          break;
        }

        // Se non abbiamo user_id nei metadata, proviamo a trovarlo
        const resolvedUserId = userId || await findUserByCustomerId(customerId);
        if (!resolvedUserId) {
          console.error("Could not find user for customer:", customerId);
          break;
        }

        // Recupera subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
        const orgId = (session.metadata as Record<string, string> | null)?.org_id ?? null;

        await updateUserSubscription({
          userId: resolvedUserId,
          orgId,
          customerId,
          subscriptionId,
          priceId,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        });

        console.log(`✅ Checkout completed for user ${resolvedUserId}`);
        break;
      }

      // Aggiornamenti subscription
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.user_id;

        const resolvedUserId = userId || await findUserByCustomerId(customerId);
        if (!resolvedUserId) {
          console.error("Could not find user for subscription update");
          break;
        }

        const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
        const orgId = (subscription.metadata as Record<string, string> | null)?.org_id ?? null;

        await updateUserSubscription({
          userId: resolvedUserId,
          orgId,
          customerId,
          subscriptionId: subscription.id,
          priceId,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        });

        console.log(`✅ Subscription ${event.type} for user ${resolvedUserId}`);
        break;
      }

      // Subscription cancellata
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.user_id;

        const resolvedUserId = userId || await findUserByCustomerId(customerId);
        if (!resolvedUserId) {
          console.error("Could not find user for subscription deletion");
          break;
        }

        // Rimuovi subscription dal database
        await supabaseAdmin
          .from("subscriptions")
          .delete()
          .eq("stripe_subscription_id", subscription.id);

        // Aggiorna profilo utente
        await supabaseAdmin
          .from("profiles")
          .update({
            current_plan: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resolvedUserId);

        // Aggiorna org_subscriptions e disattiva org_modules per l'org dell'utente
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("current_org")
          .eq("id", resolvedUserId)
          .single();

        const orgId = (subscription.metadata as Record<string, string> | null)?.org_id ?? profile?.current_org ?? null;
        if (orgId) {
          await supabaseAdmin
            .from("org_subscriptions")
            .update({
              status: "canceled",
              plan: "Free",
              stripe_subscription_id: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq("org_id", orgId);

          // Disattiva tutti i moduli tranne base
          const { data: mods } = await supabaseAdmin
            .from("org_modules")
            .select("module")
            .eq("org_id", orgId)
            .neq("module", "base");

          for (const m of mods || []) {
            await supabaseAdmin
              .from("org_modules")
              .update({ status: "inactive", updated_at: new Date().toISOString() })
              .eq("org_id", orgId)
              .eq("module", m.module);
          }
        }

        console.log(`✅ Subscription deleted for user ${resolvedUserId}`);
        break;
      }

      // Payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await findUserByCustomerId(customerId);
        
        if (userId) {
          // Aggiorna status subscription a past_due
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          console.log(`⚠️ Payment failed for user ${userId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: (error as Error).message }, 
      { status: 500 }
    );
  }
}