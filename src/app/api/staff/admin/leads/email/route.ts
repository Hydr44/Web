import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Invia singola email via Supabase Edge Function (usa Resend internamente)
async function sendViaEdgeFunction(to: string, subject: string, html: string, text: string): Promise<{ id?: string; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        type: 'custom',
        to,
        subject,
        data: { html, text },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { error: err };
    }
    const data = await res.json();
    return { id: data.email_id };
  } catch (err: any) {
    return { error: err.message };
  }
}

// Costruisce HTML email da corpo testo + variabili lead
function buildEmailHtml(bodyText: string, lead: { name?: string; email?: string; company?: string }): { html: string; text: string } {
  let text = bodyText;
  text = text.replace(/\{\{nome\}\}/gi, lead.name || 'Cliente');
  text = text.replace(/\{\{azienda\}\}/gi, lead.company || '');
  text = text.replace(/\{\{email\}\}/gi, lead.email || '');

  const bodyHtml = text.split('\n').map(line => {
    if (line.startsWith('•') || line.startsWith('-')) return `<li style="margin: 4px 0; color: #333;">${line.replace(/^[•\-]\s*/, '')}</li>`;
    if (line.trim() === '') return '<br>';
    return `<p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.6;">${line}</p>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#10b981);padding:30px 40px;border-radius:8px 8px 0 0;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:600;">RescueManager</h1>
</td></tr>
<tr><td style="padding:40px;">
${bodyHtml}
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 40px;border-radius:0 0 8px 8px;border-top:1px solid #e9ecef;">
<p style="margin:0;color:#999;font-size:12px;text-align:center;">
&copy; ${new Date().getFullYear()} RescueManager - Software Gestionale per Autodemolizioni<br>
<a href="https://rescuemanager.eu" style="color:#3b82f6;">rescuemanager.eu</a>
</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { html, text };
}

// POST - Invia email a uno o più leads via Resend
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const staff = await getStaffFromRequest(request as any);
    if (!staff) {
      return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
    }

    const body = await request.json();
    const { lead_ids, subject, body: emailBody, template_id } = body;

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Seleziona almeno un lead' }, { status: 400, headers: corsHeaders(origin) });
    }
    if (!subject || !emailBody) {
      return NextResponse.json({ success: false, error: 'Oggetto e corpo email richiesti' }, { status: 400, headers: corsHeaders(origin) });
    }

    // Recupera leads con email valida
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, company')
      .in('id', lead_ids)
      .not('email', 'is', null);

    if (leadsError || !leads || leads.length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun lead con email valida trovato' }, { status: 400, headers: corsHeaders(origin) });
    }

    // Salva campagna email
    const { data: campaign } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        subject,
        body: emailBody,
        template_id: template_id || null,
        sent_by: staff.sub,
        sent_by_email: staff.email,
        recipient_count: leads.length,
        recipient_type: 'leads',
        status: 'sending',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Invia email reali via Resend + salva recipients
    let sentCount = 0;
    let failedCount = 0;

    for (const lead of leads) {
      // Sostituisci variabili e costruisci HTML
      const subjectParsed = subject
        .replace(/\{\{nome\}\}/gi, lead.name || 'Cliente')
        .replace(/\{\{azienda\}\}/gi, lead.company || '')
        .replace(/\{\{email\}\}/gi, lead.email || '');

      const { html, text } = buildEmailHtml(emailBody, lead);

      // Invio reale via Supabase Edge Function (Resend)
      const result = await sendViaEdgeFunction(lead.email, subjectParsed, html, text);

      const recipientStatus = result.id ? 'sent' : 'failed';
      if (result.id) sentCount++; else failedCount++;

      // Salva recipient
      if (campaign) {
        await supabaseAdmin.from('email_recipients').insert({
          campaign_id: campaign.id,
          lead_id: lead.id,
          email: lead.email,
          name: lead.name,
          status: recipientStatus,
          sent_at: result.id ? new Date().toISOString() : null,
          error: result.error || null,
        });
      }

      // Aggiorna lead se era "new"
      await supabaseAdmin
        .from('leads')
        .update({ contacted_at: new Date().toISOString(), status: 'contacted', updated_at: new Date().toISOString() })
        .eq('id', lead.id)
        .eq('status', 'new');
    }

    // Aggiorna stato campagna
    if (campaign) {
      await supabaseAdmin.from('email_campaigns')
        .update({ status: failedCount === leads.length ? 'failed' : 'sent' })
        .eq('id', campaign.id);
    }

    // Log audit
    try {
      await supabaseAdmin.from('audit_log').insert({
        staff_id: staff.sub,
        staff_email: staff.email,
        action: 'email_campaign_sent',
        target_type: 'leads',
        target_id: campaign?.id || 'batch',
        target_label: `Email "${subject}" a ${leads.length} lead (${sentCount} ok, ${failedCount} errori)`,
        details: { lead_ids, subject, template_id, sent_count: sentCount, failed_count: failedCount },
      });
    } catch { /* ignore audit errors */ }

    return NextResponse.json({
      success: true,
      message: `Email inviata a ${sentCount} lead${failedCount > 0 ? ` (${failedCount} errori)` : ''}`,
      campaign_id: campaign?.id,
      sent_count: sentCount,
      failed_count: failedCount,
      skipped_count: lead_ids.length - leads.length,
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Email send error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore invio email' }, { status: 500, headers: corsHeaders(origin) });
  }
}
