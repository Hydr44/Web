import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { findDuplicateLead } from "@/lib/lead-dedup";
import { brandedHtml, EMAIL_FONT } from "@/lib/email-template";
import {
  checkRateLimit, 
  getRateLimitIdentifier, 
  logSecurityEvent, 
  validateEmail, 
  validateText, 
  validatePhone,
  sanitizeInput 
} from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // Rate limiting - max 3 richieste per IP in 10 minuti
    const rateLimitId = getRateLimitIdentifier(request, 'ip');
    const rateLimit = await checkRateLimit(rateLimitId, 3, 10 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      const minutesRemaining = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
      
      await logSecurityEvent({
        type: 'rate_limit_exceeded',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { endpoint: 'contact_form', remaining_minutes: minutesRemaining },
      });

      return NextResponse.json(
        { success: false, error: `Troppi invii. Riprova tra ${minutesRemaining} minuti.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      type,
      source,
      name,
      email,
      phone,
      company,
      message
    } = body;

    // Validate required fields
    if (!name || !email || !type) {
      return NextResponse.json(
        { success: false, error: "Campi obbligatori mancanti" },
        { status: 400 }
      );
    }

    // Enforcement: registrazione disabilitata globalmente dall'admin.
    // Riguarda solo le richieste di accesso (la pagina /register), non i
    // contatti generici. Fail-open in caso di errore lettura settings.
    if (type === 'access_request') {
      try {
        const { data: regSetting } = await supabaseAdmin
          .from('system_settings')
          .select('value')
          .eq('key', 'registration_enabled')
          .maybeSingle();
        const registrationEnabled =
          regSetting?.value !== false && regSetting?.value !== 'false';
        if (!registrationEnabled) {
          await logSecurityEvent({
            type: 'suspicious_activity',
            ip_address: ip,
            user_agent: userAgent,
            metadata: { endpoint: 'contact_form', reason: 'registration_disabled', email },
          });
          return NextResponse.json(
            {
              success: false,
              error:
                'Le registrazioni sono temporaneamente sospese. Scrivici a info@rescuemanager.eu per richiedere accesso.',
            },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error('[Contact] errore check registration_enabled:', err);
        // fail-open: non bloccare le richieste se la lettura fallisce
      }
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: emailValidation.errors[0] },
        { status: 400 }
      );
    }

    // Validate name
    const nameValidation = validateText(name, 'Nome', 2, 100);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nameValidation.errors[0] },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return NextResponse.json(
          { success: false, error: phoneValidation.errors[0] },
          { status: 400 }
        );
      }
    }

    // Validate message if provided
    if (message) {
      const messageValidation = validateText(message, 'Messaggio', 0, 2000);
      if (!messageValidation.valid) {
        return NextResponse.json(
          { success: false, error: messageValidation.errors[0] },
          { status: 400 }
        );
      }
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedCompany = company ? sanitizeInput(company) : null;
    const sanitizedMessage = message ? sanitizeInput(message) : null;

    // Anti-duplicati (Fase 0): se esiste già un lead con questa email NON creiamo
    // un doppione — riusiamo il lead esistente e vi alleghiamo il nuovo contatto.
    const dup = await findDuplicateLead(supabaseAdmin, { email: sanitizedEmail, phone });
    let lead: { id: string };
    if (dup.exact) {
      lead = dup.exact;
      await supabaseAdmin.from('lead_activities').insert({
        lead_id: lead.id,
        activity_type: 'contact',
        title: `Nuovo contatto dal sito (${type})`,
        description: sanitizedMessage || null,
        performed_by_type: 'lead',
        metadata: { source, type, via: 'contact_form', deduped: true },
      });
      // Riporta a galla il lead nella lista (ordinata per attività/aggiornamento).
      await supabaseAdmin
        .from('leads')
        .update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', lead.id);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('leads')
        .insert({
          type,
          source,
          name: sanitizedName,
          email: sanitizedEmail,
          phone: phone || null,
          company: sanitizedCompany,
          notes: sanitizedMessage,
          status: 'new',
          priority: type === 'quote' ? 'high' : 'medium'
        })
        .select()
        .single();

      if (error || !created) {
        console.error('Error creating lead:', error);
        return NextResponse.json(
          { success: false, error: "Errore durante il salvataggio" },
          { status: 500 }
        );
      }
      lead = created;
    }

    // Log successful submission
    await logSecurityEvent({
      type: 'api_call',
      email: sanitizedEmail,
      ip_address: ip,
      user_agent: userAgent,
      metadata: { endpoint: 'contact_form', type, lead_id: lead.id },
    });

    // Send emails via Resend API (graceful degradation if key not set)
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY) {
      const isDemo = type === 'demo';
      const staffSubject = isDemo
        ? `[Demo] Nuova richiesta da ${sanitizedName} — ${sanitizedCompany || 'privato'}`
        : `[Contatto] Messaggio da ${sanitizedName}`;
      const clientSubject = 'RescueManager';

      const staffInfoRows: Array<{ label: string; value: string }> = [
        { label: 'Nome', value: sanitizedName },
        { label: 'Email', value: `<a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a>` },
      ];
      if (phone) staffInfoRows.push({ label: 'Telefono', value: `<a href="tel:${phone}">${phone}</a>` });
      if (sanitizedCompany) staffInfoRows.push({ label: 'Azienda', value: sanitizedCompany });
      if (sanitizedMessage) staffInfoRows.push({ label: 'Messaggio', value: sanitizedMessage.replace(/\n/g, '<br>') });

      const staffHtml = brandedHtml(
        `Nuova ${isDemo ? 'richiesta di demo' : 'richiesta di contatto'}`,
        {
          subtitle: isDemo ? 'Nuova Richiesta Demo' : 'Nuovo Messaggio di Contatto',
          infoRows: staffInfoRows,
          footerNote: `Lead ID: ${lead.id}<br>Ricevuto: ${new Date().toLocaleString('it-IT')}`,
        }
      );

      const confirmExtraHtml = `<ul style="margin:16px 0;padding-left:24px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
  <li>Rispondere a tutte le tue domande</li>
  <li>Discutere le tue esigenze specifiche</li>
  <li>Organizzare una dimostrazione personalizzata${isDemo ? '' : ' (se interessato)'}</li>
</ul>`;

      const confirmHtml = brandedHtml(
        `Ciao ${sanitizedName},
Grazie per averci contattato! Apprezziamo molto il tuo interesse in RescueManager.
Abbiamo ricevuto la tua richiesta e il nostro team ti contatterà entro 24 ore per:`,
        {
          subtitle: 'Grazie per averci contattato',
          extraHtml: confirmExtraHtml,
          cta: { href: 'https://rescuemanager.eu', label: 'Scopri RescueManager' },
          footerNote: 'Nel frattempo, se hai domande urgenti, contattaci a info@rescuemanager.eu o chiama +39 392 172 3028.<br><br>A presto, il team RescueManager.',
        }
      );

      const sendEmail = async (to: string, subject: string, html: string) => {
        try {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'RescueManager <noreply@rescuemanager.eu>', to, subject, html }),
          });
          if (!r.ok) {
            const txt = await r.text();
            console.error('[Contact] Email error da Resend:', r.status, txt);
          }
        } catch (err) {
          console.error('[Contact] Email error di rete:', err);
        }
      };

      await Promise.allSettled([
        sendEmail('info@rescuemanager.eu', staffSubject, staffHtml),
        sendEmail(sanitizedEmail, clientSubject, confirmHtml),
      ]);
    }

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      message: "Richiesta inviata con successo"
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}