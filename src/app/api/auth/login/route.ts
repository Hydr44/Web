// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, password, redirectTo } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "missing_credentials" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }

  // A questo punto Supabase SSR ha scritto i cookie (con domain .rescuemanager.eu)
  // perché siamo in un Route Handler.
  return NextResponse.json({
    ok: true,
    user: data.user,
    redirectTo: redirectTo || "/dashboard",
  });
}
