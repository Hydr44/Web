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
 * GET /api/sync/pull
 * Pull data from database for an organization
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
    const table = searchParams.get('table');
    const since = searchParams.get('since');

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

    // Se specificata una tabella, fai sync solo quella
    if (table) {
      return await pullTable(table, orgId, since);
    }

    // Altrimenti fai sync di tutte le tabelle
    const tables = ['clients', 'transports', 'quotes', 'yard_items', 'spare_parts'];
    const data: Record<string, any[]> = {};

    for (const table of tables) {
      const result = await pullTable(table, orgId, since);
      const jsonData = await result.json();
      if (jsonData.success && jsonData.data) {
        data[table] = jsonData.data;
      }
    }

    return NextResponse.json({
      success: true,
      org_id: orgId,
      data,
      pulled_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync pull error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function pullTable(table: string, orgId: string, since: string | null) {
  try {
    let query = supabaseAdmin
      .from(table)
      .select('*')
      .eq('org_id', orgId);

    // Sync incrementale se specificato since
    if (since) {
      query = query.gte('updated_at', since);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      table,
      data: data || [],
      count: data?.length || 0,
      pulled_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error pulling ${table}:`, error);
    return NextResponse.json({
      success: false,
      error: `Failed to pull ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

