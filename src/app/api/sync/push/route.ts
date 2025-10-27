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
 * POST /api/sync/push
 * Push changes from desktop app to database
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { org_id, table, data } = body;

    if (!org_id || !table || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, table, data' },
        { status: 400 }
      );
    }

    // Verifica che l'utente appartenga all'org
    const { data: member, error: memberError } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role')
      .eq('org_id', org_id)
      .eq('user_id', decoded.user_id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Not authorized for this org' }, { status: 403 });
    }

    // Push data
    const result = await pushData(table, org_id, data, decoded.user_id);

    return result;

  } catch (error) {
    console.error('Sync push error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function pushData(
  table: string, 
  orgId: string, 
  data: any[] | any, 
  userId: string
) {
  try {
    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];

    // Validazione: assicurati che tutti gli item abbiano org_id
    for (const item of items) {
      if (item.org_id !== orgId) {
        return NextResponse.json(
          { error: `org_id mismatch. Expected ${orgId}, got ${item.org_id}` },
          { status: 400 }
        );
      }
    }

    // Upsert data
    const { data: result, error } = await supabaseAdmin
      .from(table)
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      table,
      data: result,
      pushed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error pushing to ${table}:`, error);
    return NextResponse.json({
      success: false,
      error: `Failed to push to ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

