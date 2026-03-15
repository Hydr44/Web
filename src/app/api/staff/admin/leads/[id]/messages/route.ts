/**
 * Lead Messages API - Chat staff↔lead via email
 * GET  /api/staff/admin/leads/:id/messages - Lista messaggi
 * POST /api/staff/admin/leads/:id/messages - Invia messaggio al lead
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

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
        const emailHtml = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; }
    .wrapper { background: #f3f4f6; padding: 32px 16px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 32px; }
    .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 700; }
    .header p { color: #94a3b8; margin: 4px 0 0; font-size: 13px; }
    .content { padding: 32px; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
    .message-body { background: #f8fafc; border-left: 3px solid #2563eb; padding: 16px 20px; border-radius: 0 6px 6px 0; font-size: 14px; color: #1e293b; line-height: 1.7; white-space: pre-wrap; }
    .footer { background: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    .footer a { color: #6b7280; }
    .sender { margin-top: 24px; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>RescueManager</h1>
        <p>Messaggio dal team RescueManager</p>
      </div>
      <div class="content">
        <p class="greeting">Ciao <strong>${lead.name}</strong>,</p>
        <div class="message-body">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
        <p class="sender">— ${sent_by_name || 'Il team RescueManager'}</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} RescueManager &middot;
        <a href="https://rescuemanager.eu">rescuemanager.eu</a>
        &middot; <a href="mailto:info@rescuemanager.eu">info@rescuemanager.eu</a>
      </div>
    </div>
  </div>
</body>
</html>`;

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
