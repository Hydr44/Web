import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import jwt from 'jsonwebtoken';

export const runtime = "nodejs";

// Verifica token OAuth
function verifyOAuthToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET || 'desktop_oauth_secret_key_change_in_production';
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

/**
 * GET /api/sync/status
 * Restituisce lo stato di sincronizzazione per un'organizzazione
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyOAuthToken(token) as any;
    
    if (!decoded?.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    // Verifica che l'utente appartenga all'org
    const { data: member, error: memberError } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role')
      .eq('org_id', orgId)
      .eq('user_id', decoded.user_id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Not authorized for this org' }, { status: 403 });
    }

    // Ottieni timestamp ultimo sync per varie tabelle
    const tables = ['clients', 'transports', 'quotes', 'demolition_cases'];
    const syncStatus: Record<string, any> = {};

    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('updated_at, created_at')
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      syncStatus[table] = {
        last_sync: data?.updated_at || data?.created_at || null,
        ready: true
      };
    }

    return NextResponse.json({
      success: true,
      org_id: orgId,
      sync_status: syncStatus,
      last_check: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

