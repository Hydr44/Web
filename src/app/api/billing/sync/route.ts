// src/app/api/billing/sync/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json(
        { ok: false, error: "missing_session_id" },
        { status: 400 }
      );
    }

    // Recupera la sessione e la subscription
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription", "customer"],
    });

    if (!session.subscription) {
      return NextResponse.json(
        { ok: false, error: "missing_subscription" },
        { status: 400 }
      );
    }

    const sub = session.subscription as Stripe.Subscription;

    // Tentativi per ricavare user_id e customer_id
    const userId =
      session.metadata?.user_id ?? sub.metadata?.user_id ?? null;
    const customerId =
      (session.customer as string | undefined) ??
      (sub.customer as string | undefined) ??
      null;

    const priceId = sub.items?.data?.[0]?.price?.id ?? null;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "missing_user_id" },
        { status: 400 }
      );
    }

    // Aggiorna la tabella subscriptions
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: sub.id,
          price_id: priceId,
          status: sub.status,
          current_period_end: new Date(
            (sub.current_period_end ?? 0) * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" } // <-- richiede UNIQUE(user_id)
      );

    // Mappa price_id al nome del piano
    const planMapping: Record<string, string> = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || ""]: "Starter",
      [process.env.STRIPE_PRICE_FLEET || ""]: "Flotta", 
      [process.env.STRIPE_PRICE_CONSORTIUM || ""]: "Azienda / Consorzio",
    };

    const planName = planMapping[priceId || ""] || "Unknown";

    // Aggiorna il profilo utente con il piano corrente
    await supabaseAdmin
      .from("profiles")
      .update({
        current_plan: planName,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("sync_error", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}