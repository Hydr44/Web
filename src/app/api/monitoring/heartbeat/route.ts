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
 * POST /api/monitoring/heartbeat
 * Registra heartbeat dall'app desktop
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
    const { org_id, app_version } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    // Verifica membership org
    const { data: member, error: memberError } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('org_id', org_id)
      .eq('user_id', decoded.user_id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Not authorized for this org' }, { status: 403 });
    }

    // Delete vecchio heartbeat e inserisci nuovo (user_id non è PK)
    const { error: deleteError } = await supabaseAdmin
      .from('app_heartbeats')
      .delete()
      .eq('user_id', decoded.user_id);

    if (deleteError) {
      console.error('Heartbeat delete error:', deleteError);
    }

    // Insert nuovo heartbeat
    const { error } = await supabaseAdmin
      .from('app_heartbeats')
      .insert({
        user_id: decoded.user_id,
        org_id: org_id,
        app_version: app_version || 'unknown',
        online: true,
        last_seen: new Date().toISOString()
      });

    if (error) {
      console.error('Heartbeat error:', error);
      return NextResponse.json({ error: 'Failed to save heartbeat' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Heartbeat endpoint error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

