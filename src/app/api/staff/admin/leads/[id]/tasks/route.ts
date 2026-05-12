/**
 * Tasks scoped al lead (lista + create)
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const { data, error } = await supabaseAdmin
    .from('lead_tasks')
    .select('*')
    .eq('lead_id', params.id)
    .order('status', { ascending: true })
    .order('due_at', { ascending: true, nullsFirst: false });
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  }
  return NextResponse.json({ success: true, tasks: data || [] }, { headers: corsHeaders(origin) });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const { title, description, due_at, priority, assigned_to } = body;
    if (!title) {
      return NextResponse.json({ success: false, error: 'title richiesto' }, { status: 400, headers: corsHeaders(origin) });
    }
    const { data, error } = await supabaseAdmin
      .from('lead_tasks')
      .insert({
        lead_id: params.id,
        title,
        description: description || null,
        due_at: due_at || null,
        priority: priority || 'normal',
        assigned_to: assigned_to || null,
        status: 'open',
      })
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

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
