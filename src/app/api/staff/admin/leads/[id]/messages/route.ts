/**
 * Lead Messages API - Chat staff↔lead via email
 * GET  /api/staff/admin/leads/:id/messages - Lista messaggi
 * POST /api/staff/admin/leads/:id/messages - Invia messaggio al lead
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { brandedHtml } from '@/lib/email-template';

const RESEND_KEY = process.env.RESEND_API_KEY || '';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const { data: messages, error } = await supabaseAdmin
      .from('lead_messages')
      .select('*')
      .eq('lead_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, messages: messages || [] }, { headers: corsHeaders(origin) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const { subject, body, sent_by_name, direction = 'outgoing' } = await request.json();

    if (!body?.trim()) {
      return NextResponse.json({ success: false, error: 'Il corpo del messaggio è obbligatorio' }, { status: 400, headers: corsHeaders(origin) });
    }

    // Recupera dati lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, name, email')
      .eq('id', params.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ success: false, error: 'Lead non trovato' }, { status: 404, headers: corsHeaders(origin) });
    }

    // Salva messaggio in DB
    const { data: message, error: msgError } = await supabaseAdmin
      .from('lead_messages')
      .insert({
        lead_id: params.id,
        direction,
        subject: subject || null,
        body,
        sent_by_name: sent_by_name || 'Staff RescueManager',
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ success: false, error: msgError.message }, { status: 500, headers: corsHeaders(origin) });
    }

    // Se outgoing e il lead ha email, invia via Resend
    let emailSent = false;
    if (direction === 'outgoing' && lead.email && RESEND_KEY) {
      try {
        const escapeHtml = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const emailHtml = brandedHtml(
          `Ciao ${escapeHtml(lead.name)},\n${escapeHtml(body)}`,
          {
            subtitle: 'Messaggio dal team RescueManager',
            footerNote: `— ${sent_by_name || 'Il team RescueManager'}`,
          }
        );

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'RescueManager <noreply@rescuemanager.eu>',
            to: lead.email,
            subject: subject || `Messaggio da RescueManager`,
            html: emailHtml,
            reply_to: 'info@rescuemanager.eu',
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          emailSent = true;
          // Salva ID email per tracking
          await supabaseAdmin
            .from('lead_messages')
            .update({ email_message_id: resData.id })
            .eq('id', message.id);
        } else {
          const txt = await res.text();
          console.error('[Messages] Resend error:', res.status, txt);
        }
      } catch (emailErr: any) {
        console.error('[Messages] Email send error:', emailErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message,
      email_sent: emailSent,
    }, { headers: corsHeaders(origin) });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
