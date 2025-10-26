// src/app/api/migrate-oauth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Endpoint per eseguire migrazione OAuth (solo per sviluppo)
 * POST /api/migrate-oauth
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Esegui le query di migrazione
    const queries = [
      // Rimuovi politiche esistenti
      `DROP POLICY IF EXISTS "Users can access their own oauth codes" ON public.oauth_codes;`,
      `DROP POLICY IF EXISTS "Users can access their own oauth tokens" ON public.oauth_tokens;`,
      
      // Crea nuove politiche
      `CREATE POLICY "Allow oauth code insertion" ON public.oauth_codes FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "Users can access their own oauth codes" ON public.oauth_codes FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Allow oauth token insertion" ON public.oauth_tokens FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "Users can access their own oauth tokens" ON public.oauth_tokens FOR SELECT USING (auth.uid() = user_id);`
    ];
    
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
          { error: `Migration failed: ${error.message}` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true, message: "OAuth policies updated successfully" });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    );
  }
}
