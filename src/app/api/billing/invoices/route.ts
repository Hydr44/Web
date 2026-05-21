import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { corsHeaders } from "@/lib/cors";

export const runtime = "nodejs";

/**
 * GET /api/billing/invoices
 * Ritorna le fatture Stripe del customer associato all'email dell'utente in
 * sessione. Ogni invoice include `hosted_invoice_url` (web) e `invoice_pdf`
 * (PDF reale) — niente più link "#" placeholder.
 */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json(
        { ok: false, error: "Non autenticato" },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { ok: false, error: "Stripe non configurato" },
        { status: 503, headers: corsHeaders(origin) }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });

    // Trova il customer Stripe via email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (!customers.data.length) {
      return NextResponse.json(
        { ok: true, invoices: [] },
        { headers: corsHeaders(origin) }
      );
    }
    const customerId = customers.data[0].id;

    const list = await stripe.invoices.list({ customer: customerId, limit: 50 });

    const invoices = list.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      created: inv.created, // unix
      due_date: inv.due_date,
      total: inv.total,
      currency: inv.currency?.toUpperCase() || "EUR",
      status: inv.status, // 'draft'|'open'|'paid'|'void'|'uncollectible'
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      period_start: inv.period_start,
      period_end: inv.period_end,
    }));

    return NextResponse.json(
      { ok: true, invoices },
      { headers: corsHeaders(origin) }
    );
  } catch (e: unknown) {
    console.error("[billing/invoices] error:", e);
    const msg = e instanceof Error ? e.message : "Errore interno";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
