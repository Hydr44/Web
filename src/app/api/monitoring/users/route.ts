import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * GET /api/monitoring/users
 * Recupera lista utenti online (heartbeat recente)
 */
export async function GET(request: NextRequest) {
  try {
    const FIVE_MINUTES_AGO = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('app_heartbeats')
      .select('user_id, org_id, app_version, online, last_seen')
      .eq('online', true)
      .gte('last_seen', FIVE_MINUTES_AGO)
      .order('last_seen', { ascending: false });

    if (error) {
      console.error('Error fetching online users:', error);
      return NextResponse.json({ error: 'Failed to fetch online users' }, { status: 500 });
    }

    return NextResponse.json({
      users: data || []
    });

  } catch (error) {
    console.error('Users endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

