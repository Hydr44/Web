/**
 * GET /api/staff/admin/leads/tasks — tasks aperti (tutti o filtrati)
 *   ?status=open|in_progress|done|cancelled
 *   ?assigned_to=uuid
 *   ?limit=50
 *
 * Letti direttamente da Supabase, non passa per VPS.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const assignedTo = url.searchParams.get('assigned_to');
    const limit = Number(url.searchParams.get('limit') || '100');

    let q = supabaseAdmin
      .from('lead_tasks')
      .select(`
        *,
        lead:lead_id ( id, name, company, email, phone, status, lifecycle_stage )
      `)
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      q = q.eq('status', status);
    } else {
      q = q.in('status', ['open', 'in_progress']);
    }
    if (assignedTo) q = q.eq('assigned_to', assignedTo);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }
    return NextResponse.json({ success: true, tasks: data || [] }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
