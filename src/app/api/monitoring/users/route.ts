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

    const { data: heartbeats, error: heartbeatsError } = await supabaseAdmin
      .from('app_heartbeats')
      .select('user_id, org_id, app_version, online, last_seen')
      .eq('online', true)
      .gte('last_seen', FIVE_MINUTES_AGO)
      .order('last_seen', { ascending: false });

    if (heartbeatsError) {
      console.error('Error fetching heartbeats:', heartbeatsError);
      return NextResponse.json({ error: 'Failed to fetch online users' }, { status: 500 });
    }

    // Recupera dettagli utenti
    const userIds = [...new Set((heartbeats || []).map(h => h.user_id))];
    const orgIds = [...new Set((heartbeats || []).map(h => h.org_id))];

    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from('orgs')
      .select('id, name')
      .in('id', orgIds);

    if (usersError || orgsError) {
      console.error('Error fetching user/org details:', { usersError, orgsError });
    }

    // Combina dati
    const userMap = new Map((users || []).map(u => [u.id, u]));
    const orgMap = new Map((orgs || []).map(o => [o.id, o]));

    const usersWithDetails = (heartbeats || []).map(heartbeat => ({
      ...heartbeat,
      user: userMap.get(heartbeat.user_id) || { email: 'Sconosciuto', full_name: 'Sconosciuto' },
      org: orgMap.get(heartbeat.org_id) || { name: 'Sconosciuta' }
    }));

    return NextResponse.json({
      users: usersWithDetails
    });

  } catch (error) {
    console.error('Users endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

