// src/app/api/billing/debug/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function GET(req: Request) {
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
      .select("stripe_customer_id, current_plan")
      .eq("id", user.id)
      .single();

    const debug = {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        stripe_customer_id: profile?.stripe_customer_id,
        current_plan: profile?.current_plan,
      },
      stripe: {
        customers: [],
        subscriptions: [],
      },
    };

    // Se abbiamo un customer_id, recupera i dati da Stripe
    if (profile?.stripe_customer_id) {
      try {
        // Recupera il customer
        const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
        debug.stripe.customers = [customer];

        // Recupera le subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 10,
        });
        debug.stripe.subscriptions = subscriptions.data;
      } catch (error) {
        debug.stripe.error = (error as Error).message;
      }
    } else {
      // Prova a cercare per email
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 5,
        });
        debug.stripe.customers = customers.data;

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 10,
          });
          debug.stripe.subscriptions = subscriptions.data;
        }
      } catch (error) {
        debug.stripe.error = (error as Error).message;
      }
    }

    return NextResponse.json({ ok: true, debug });

  } catch (e: unknown) {
    console.error("debug_error", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
