// src/app/api/billing/simulate-plan/route.ts
// Endpoint di TEST: simula l'attivazione di un piano per verificare che l'app risponda.
// Usa solo in sviluppo (NODE_ENV=development).
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const PLAN_MODULES: Record<string, string[]> = {
  Starter: ["sdi"],
  Professional: ["sdi", "rvfu"],
  Business: ["sdi", "rvfu", "rentri"],
  Full: ["sdi", "rvfu", "rentri"],
};

export async function POST(req: Request) {
  // Solo in sviluppo
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "Solo in development" }, { status: 403 });
  }

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
      .select("current_org")
      .eq("id", user.id)
      .single();

    const orgId = profile?.current_org;
    if (!orgId) {
      return NextResponse.json(
        { ok: false, error: "Nessuna organizzazione. Crea o seleziona un'org." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = (body.plan as string) || "Full";

    const modules = PLAN_MODULES[plan] || PLAN_MODULES.Full;
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Upsert org_subscriptions
    await supabaseAdmin.from("org_subscriptions").upsert(
      {
        org_id: orgId,
        plan,
        status: "active",
        current_period_end: periodEnd,
        updated_at: now,
      },
      { onConflict: "org_id" }
    );

    // Aggiorna anche profiles.current_plan per coerenza (debug, admin, ecc.)
    await supabaseAdmin.from("profiles").update({
      current_plan: plan,
      updated_at: now,
    }).eq("id", user.id);

    // Inserisci moduli
    for (const mod of modules) {
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

    return NextResponse.json({
      ok: true,
      message: `Piano ${plan} simulato per la tua organizzazione`,
      org_id: orgId,
      plan,
      modules,
    });
  } catch (e: unknown) {
    console.error("[simulate-plan]", e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
