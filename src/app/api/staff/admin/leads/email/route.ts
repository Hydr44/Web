import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

// POST - Invia email a uno o più leads
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
    const { data: campaign, error: campError } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        subject,
        body: emailBody,
        template_id: template_id || null,
        sent_by: staff.sub,
        sent_by_email: staff.email,
        recipient_count: leads.length,
        recipient_type: 'leads',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Salva singoli invii
    if (campaign) {
      const recipients = leads.map(lead => ({
        campaign_id: campaign.id,
        lead_id: lead.id,
        email: lead.email,
        name: lead.name,
        status: 'queued',
      }));

      await supabaseAdmin.from('email_recipients').insert(recipients);
    }

    // Aggiorna ultimo contatto sui leads
    for (const lead of leads) {
      await supabaseAdmin
        .from('leads')
        .update({
          contacted_at: new Date().toISOString(),
          status: 'contacted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .in('status', ['new']); // Solo se sono ancora "new"
    }

    // Log audit
    try {
      await supabaseAdmin.from('audit_log').insert({
        staff_id: staff.sub,
        staff_email: staff.email,
        action: 'email_campaign_sent',
        target_type: 'leads',
        target_id: campaign?.id || 'batch',
        target_label: `Email "${subject}" a ${leads.length} lead`,
        details: { lead_ids, subject, template_id, recipient_count: leads.length },
      });
    } catch { /* ignore audit errors */ }

    return NextResponse.json({
      success: true,
      message: `Email inviata a ${leads.length} lead`,
      campaign_id: campaign?.id,
      sent_count: leads.length,
      skipped_count: lead_ids.length - leads.length,
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Email send error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore invio email' }, { status: 500, headers: corsHeaders(origin) });
  }
}
