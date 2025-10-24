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
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || ""]: "Starter",
  [process.env.STRIPE_PRICE_FLEET || ""]: "Flotta", 
  [process.env.STRIPE_PRICE_CONSORTIUM || ""]: "Azienda / Consorzio",
};

async function updateUserSubscription(params: {
  userId: string;
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  status: string;
  currentPeriodEnd: number;
}) {
  const { userId, customerId, subscriptionId, priceId, status, currentPeriodEnd } = params;
  
  const planName = PLAN_MAPPING[priceId || ""] || "Unknown";

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

  console.log(`✅ Subscription updated for user ${userId}: ${planName} (${status})`);
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

        await updateUserSubscription({
          userId: resolvedUserId,
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

        await updateUserSubscription({
          userId: resolvedUserId,
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