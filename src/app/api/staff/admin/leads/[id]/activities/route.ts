/**
 * GET  /api/staff/admin/leads/:id/activities — timeline lead
 * POST /api/staff/admin/leads/:id/activities — log manuale (nota staff)
 *
 * Legge direttamente da Supabase (non passa per VPS).
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const { data, error } = await supabaseAdmin
      .from('lead_activities')
      .select('*')
      .eq('lead_id', params.id)
      .order('occurred_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }
    return NextResponse.json({ success: true, activities: data || [] }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const { activity_type, title, description, performed_by, metadata, related_quote_id } = body;
    if (!activity_type || !title) {
      return NextResponse.json({ success: false, error: 'activity_type e title richiesti' }, { status: 400, headers: corsHeaders(origin) });
    }
    const { data, error } = await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id: params.id,
        activity_type,
        title,
        description: description || null,
        performed_by: performed_by || null,
        performed_by_type: 'staff',
        metadata: metadata || {},
        related_quote_id: related_quote_id || null,
      })
      .select().single();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }
    return NextResponse.json({ success: true, activity: data }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
