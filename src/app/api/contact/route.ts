import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { findDuplicateLead } from "@/lib/lead-dedup";
import { brandedHtml } from "@/lib/email-template";
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
      const cosa = isDemo ? 'Richiesta di demo' : 'Richiesta di contatto';
      const daChi = sanitizedCompany ? `${sanitizedName}, ${sanitizedCompany}` : sanitizedName;
      const staffSubject = `${cosa} da ${daChi}`;
      const clientSubject = isDemo
        ? 'Abbiamo ricevuto la tua richiesta di demo'
        : 'Abbiamo ricevuto il tuo messaggio';

      const ricevutoIl = new Date().toLocaleString('it-IT');

      const staffRows: Array<[string, string]> = [
        ['Nome', sanitizedName],
        ['Email', `<a href="mailto:${sanitizedEmail}" style="color:#005dfa;text-decoration:none;">${sanitizedEmail}</a>`],
      ];
      if (phone) staffRows.push(['Telefono', `<a href="tel:${phone}" style="color:#005dfa;text-decoration:none;">${phone}</a>`]);
      if (sanitizedCompany) staffRows.push(['Azienda', sanitizedCompany]);
      staffRows.push(['Arrivata da', source || 'sito']);
      if (sanitizedMessage) staffRows.push(['Messaggio', sanitizedMessage.replace(/\n/g, '<br>')]);

      const staffHtml = brandedHtml(
        `${cosa} arrivata dal sito il ${ricevutoIl}.`,
        {
          title: cosa,
          sub: daChi,
          rows: staffRows,
          note: `Riferimento della scheda contatto: ${lead.id}`,
          reason: 'Ricevi questa email perché arriva dai moduli di contatto di rescuemanager.eu.',
        }
      );

      const clientRows: Array<[string, string]> = [
        ['Richiesta', isDemo ? 'Demo di RescueManager' : 'Contatto'],
        ['Nome', sanitizedName],
      ];
      if (sanitizedCompany) clientRows.push(['Azienda', sanitizedCompany]);
      if (sanitizedMessage) clientRows.push(['Il tuo messaggio', sanitizedMessage.replace(/\n/g, '<br>')]);

      const confirmHtml = brandedHtml(
        [
          isDemo
            ? 'Abbiamo ricevuto la tua richiesta di demo e ti ricontattiamo entro un giorno lavorativo per fissare data e ora.'
            : 'Abbiamo ricevuto il tuo messaggio e ti rispondiamo entro un giorno lavorativo.',
          'Se nel frattempo vuoi aggiungere qualcosa, rispondi a questa email.',
        ].join('\n'),
        {
          title: isDemo ? 'Richiesta di demo ricevuta' : 'Messaggio ricevuto',
          sub: `${sanitizedName}, ${ricevutoIl}`,
          rows: clientRows,
          note: 'Per qualcosa di urgente puoi chiamare il numero 392 172 3028.',
          reason: 'Ricevi questa email perché hai scritto a RescueManager dal sito.',
          preheader: 'Ti rispondiamo entro un giorno lavorativo.',
        }
      );

      // replyTo: chi riceve deve poter rispondere davvero (il mittente è noreply).
      const sendEmail = async (to: string, subject: string, html: string, replyTo?: string) => {
        try {
          const payload: Record<string, unknown> = {
            from: 'RescueManager <noreply@rescuemanager.eu>', to, subject, html,
          };
          if (replyTo) payload.reply_to = replyTo;
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
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
        sendEmail('info@rescuemanager.eu', staffSubject, staffHtml, sanitizedEmail),
        sendEmail(sanitizedEmail, clientSubject, confirmHtml, 'info@rescuemanager.eu'),
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