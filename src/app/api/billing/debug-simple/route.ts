// src/app/api/billing/debug-simple/route.ts - Test semplice per diagnosticare il problema
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("🔧 Simple debug API called");
    
    // Test 1: Verifica variabili d'ambiente
    const envCheck = {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    
    console.log("🔍 Environment check:", envCheck);
    
    // Test 2: Verifica import Supabase
    let supabaseStatus = "not_imported";
    try {
      const { supabaseServer } = await import("@/lib/supabase-server");
      supabaseStatus = "imported_successfully";
      console.log("✅ Supabase server import successful");
    } catch (error) {
      supabaseStatus = `import_failed: ${(error as Error).message}`;
      console.error("❌ Supabase server import failed:", error);
    }
    
    // Test 3: Verifica import Stripe
    let stripeStatus = "not_imported";
    try {
      const Stripe = (await import("stripe")).default;
      stripeStatus = "imported_successfully";
      console.log("✅ Stripe import successful");
    } catch (error) {
      stripeStatus = `import_failed: ${(error as Error).message}`;
      console.error("❌ Stripe import failed:", error);
    }
    
    return NextResponse.json({
      ok: true,
      debug: {
        environment: envCheck,
        supabase: supabaseStatus,
        stripe: stripeStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (e: unknown) {
    console.error("❌ Simple debug error:", e);
    return NextResponse.json({ 
      ok: false, 
      error: (e as Error).message,
      stack: (e as Error).stack 
    }, { status: 500 });
  }
}
