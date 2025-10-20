// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

async function upsertSubscription(params: {
  user_id: string;
  customer_id: string;
  subscription_id: string;
  price_id: string | null;
  status: string;
  current_period_end: number; // epoch seconds
}) {
  const {
    user_id,
    customer_id,
    subscription_id,
    price_id,
    status,
    current_period_end,
  } = params;

  await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id,
        stripe_customer_id: customer_id,
        stripe_subscription_id: subscription_id,
        price_id: price_id ?? null,
        status,
        current_period_end: new Date(current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" } // <-- richiede UNIQUE(user_id)
    );
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verify failed:", err?.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      /** Checkout completato (subscription) */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const subscriptionId = session.subscription as string | undefined;
        const customerId =
          (session.customer as string | undefined) ??
          (session.customer_details as any)?.customer;
        const userId = session.metadata?.user_id;

        if (!subscriptionId || !customerId || !userId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items?.data?.[0]?.price?.id ?? null;

        await upsertSubscription({
          user_id: userId,
          customer_id: customerId,
          subscription_id: subscriptionId,
          price_id: priceId,
          status: sub.status,
          current_period_end: sub.current_period_end!,
        });
        break;
      }

      /** Aggiornamenti dello stato dell’abbonamento */
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items?.data?.[0]?.price?.id ?? null;

        // Prova a risalire all'utente:
        // 1) se c'è già in tabella (lookup via customer)
        // 2) altrimenti metadata dello subscription
        let userId: string | null = null;

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        userId = existing?.user_id ?? (sub.metadata?.user_id ?? null);

        if (!userId) break;

        await upsertSubscription({
          user_id: userId,
          customer_id: customerId,
          subscription_id: sub.id,
          price_id: priceId,
          status: sub.status,
          current_period_end: sub.current_period_end!,
        });
        break;
      }

      /** (Facoltativo) Pagamento fattura andato a buon fine */
      case "invoice.payment_succeeded": {
        // Qui puoi loggare ID fattura, amount, ecc.
        break;
      }

      default:
        // no-op
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook_handler_error", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}