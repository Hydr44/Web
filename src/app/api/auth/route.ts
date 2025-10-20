// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut(); // rimuove i cookie
  return NextResponse.json({ ok: true, redirectTo: "/" });
}
