/**
 * PUT/DELETE /api/staff/admin/leads/tasks/:tid
 * Update status (done/in_progress/cancelled) e altri campi.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function PUT(request: Request, { params }: { params: { tid: string } }) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const allowed = ['title', 'description', 'due_at', 'priority', 'status', 'assigned_to', 'completed_by'];
    const update: Record<string, any> = {};
    for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];
    if (update.status === 'done' && !update.completed_at) {
      update.completed_at = new Date().toISOString();
    }
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('lead_tasks')
      .update(update)
      .eq('id', params.tid)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }
    return NextResponse.json({ success: true, task: data }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function DELETE(request: Request, { params }: { params: { tid: string } }) {
  const origin = request.headers.get('origin');
  const { error } = await supabaseAdmin.from('lead_tasks').delete().eq('id', params.tid);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  }
  return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
