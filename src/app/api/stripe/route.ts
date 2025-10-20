import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        // Trova user_id dalla customer
        const customerId = sub.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile?.id) {
          const payload = {
            id: sub.id,
            user_id: profile.id,
            status: sub.status,
            price_id: sub.items?.data?.[0]?.price?.id ?? null,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          };

          if (event.type === "customer.subscription.deleted") {
            await supabase.from("subscriptions").delete().eq("id", sub.id);
          } else {
            await supabase.from("subscriptions").upsert(payload);
          }
        }
        break;
      }
      default:
        // ignora altri eventi, o loggali
        break;
    }
    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Webhook handler error" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false, // importante: usiamo raw body
  },
};
