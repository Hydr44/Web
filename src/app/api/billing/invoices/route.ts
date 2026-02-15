// src/app/api/billing/invoices/route.ts - Storico fatture/pagamenti Stripe
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email ?? undefined,
        limit: 1,
      });
      customerId = customers.data[0]?.id ?? null;
    }

    if (!customerId) {
      return NextResponse.json({
        ok: true,
        invoices: [],
        message: "Nessun customer Stripe trovato per questo utente.",
      });
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 20, 50);
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
      status: "paid",
    });

    const items = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number ?? inv.id,
      status: inv.status,
      amount_paid: inv.amount_paid ? inv.amount_paid / 100 : 0,
      currency: inv.currency,
      created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      paid_at: inv.status_transitions?.paid_at
        ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
        : null,
      invoice_pdf: inv.invoice_pdf ?? null,
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
    }));

    return NextResponse.json({ ok: true, invoices: items });
  } catch (e) {
    console.error("[billing/invoices]", e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
