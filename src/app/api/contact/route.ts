import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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

    // Create lead in database
    const { data: lead, error } = await supabaseAdmin
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

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { success: false, error: "Errore durante il salvataggio" },
        { status: 500 }
      );
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
      const subject = isDemo
        ? `[Demo] Nuova richiesta da ${sanitizedName} — ${sanitizedCompany || 'privato'}`
        : `[Contatto] Messaggio da ${sanitizedName}`;

      const staffHtml = `
        <h2>${isDemo ? 'Nuova richiesta demo' : 'Nuovo messaggio di contatto'}</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px;font-weight:bold;background:#f8fafc">Nome</td><td style="padding:6px">${sanitizedName}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;background:#f8fafc">Email</td><td style="padding:6px">${sanitizedEmail}</td></tr>
          ${phone ? `<tr><td style="padding:6px;font-weight:bold;background:#f8fafc">Telefono</td><td style="padding:6px">${phone}</td></tr>` : ''}
          ${sanitizedCompany ? `<tr><td style="padding:6px;font-weight:bold;background:#f8fafc">Azienda</td><td style="padding:6px">${sanitizedCompany}</td></tr>` : ''}
          ${sanitizedMessage ? `<tr><td style="padding:6px;font-weight:bold;background:#f8fafc">Messaggio</td><td style="padding:6px">${sanitizedMessage}</td></tr>` : ''}
        </table>
        <p style="margin-top:16px;font-size:12px;color:#64748b">Lead ID: ${lead.id}</p>
      `;

      const confirmHtml = isDemo
        ? `<h2>Richiesta demo ricevuta!</h2><p>Ciao ${sanitizedName},</p><p>Abbiamo ricevuto la tua richiesta di demo per <strong>RescueManager</strong>. Ti contatteremo entro 24 ore per organizzare la dimostrazione personalizzata.</p><p>A presto,<br>Il team RescueManager</p>`
        : `<h2>Messaggio ricevuto!</h2><p>Ciao ${sanitizedName},</p><p>Abbiamo ricevuto il tuo messaggio e ti risponderemo il prima possibile.</p><p>A presto,<br>Il team RescueManager</p>`;

      const sendEmail = async (to: string, subject: string, html: string) => {
        try {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'noreply@rescuemanager.eu', to, subject, html }),
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
        sendEmail('info@rescuemanager.eu', subject, staffHtml),
        sendEmail(sanitizedEmail, isDemo ? 'Richiesta demo RescueManager — ricevuta!' : 'Messaggio ricevuto — RescueManager', confirmHtml),
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