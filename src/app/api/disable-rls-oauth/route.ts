// src/app/api/disable-rls-oauth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Endpoint per disabilitare temporaneamente RLS sulle tabelle OAuth
 * POST /api/disable-rls-oauth
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Disabilita RLS temporaneamente per test
    const queries = [
      `ALTER TABLE public.oauth_codes DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.oauth_tokens DISABLE ROW LEVEL SECURITY;`
    ];
    
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error('RLS disable error:', error);
        return NextResponse.json(
          { error: `RLS disable failed: ${error.message}` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true, message: "RLS disabled for OAuth tables" });
    
  } catch (error) {
    console.error('RLS disable error:', error);
    return NextResponse.json(
      { error: 'RLS disable failed' },
      { status: 500 }
    );
  }
}
