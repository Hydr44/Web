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

      // Template wrapper per email professionali
      const wrapTemplate = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; }
    .content p { margin: 0 0 16px; font-size: 14px; color: #6b7280; }
    .content strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; }
    table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; }
    table tr:last-child td { border-bottom: none; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .footer a { color: #6b7280; text-decoration: none; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} RescueManager &middot;
      <a href="https://rescuemanager.eu">rescuemanager.eu</a>
    </div>
  </div>
</body>
</html>`;

      const staffBody = `
<p><strong>Nuova ${isDemo ? 'richiesta di demo' : 'richiesta di contatto'}</strong></p>
<table>
  <tr>
    <th>Campo</th>
    <th>Valore</th>
  </tr>
  <tr>
    <td><strong>Nome</strong></td>
    <td>${sanitizedName}</td>
  </tr>
  <tr>
    <td><strong>Email</strong></td>
    <td><a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a></td>
  </tr>
  ${phone ? `<tr><td><strong>Telefono</strong></td><td><a href="tel:${phone}">${phone}</a></td></tr>` : ''}
  ${sanitizedCompany ? `<tr><td><strong>Azienda</strong></td><td>${sanitizedCompany}</td></tr>` : ''}
  ${sanitizedMessage ? `<tr><td><strong>Messaggio</strong></td><td>${sanitizedMessage.replace(/\n/g, '<br>')}</td></tr>` : ''}
</table>
<p style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
  <strong>Lead ID:</strong> ${lead.id}<br>
  <strong>Ricevuto:</strong> ${new Date().toLocaleString('it-IT')}
</p>`;

      const staffHtml = wrapTemplate(
        isDemo ? '📊 Nuova Richiesta Demo' : '💬 Nuovo Messaggio di Contatto',
        staffBody
      );

      const confirmBody = isDemo
        ? `
<p>Ciao <strong>${sanitizedName}</strong>,</p>
<p>Grazie per l'interesse in <strong>RescueManager</strong>! Abbiamo ricevuto la tua richiesta di demo.</p>
<p>Il nostro team ti contatterà entro <strong>24 ore</strong> per:</p>
<ul style="margin: 16px 0; padding-left: 24px; color: #6b7280;">
  <li>Organizzare una dimostrazione personalizzata</li>
  <li>Rispondere a tutte le tue domande</li>
  <li>Discutere le tue esigenze specifiche</li>
</ul>
<p style="text-align: center; margin: 24px 0;">
  <a href="https://rescuemanager.eu" class="cta">Visita il nostro sito</a>
</p>
<p>Se hai domande urgenti, contattaci a <strong>info@rescuemanager.eu</strong> o chiama <strong>+39 392 172 3028</strong>.</p>
<p>A presto,<br><strong>Il team RescueManager</strong></p>`
        : `
<p>Ciao <strong>${sanitizedName}</strong>,</p>
<p>Abbiamo ricevuto il tuo messaggio e lo apprezziamo molto!</p>
<p>Ti risponderemo il prima possibile, solitamente entro <strong>24 ore</strong>.</p>
<p style="text-align: center; margin: 24px 0;">
  <a href="https://rescuemanager.eu" class="cta">Scopri RescueManager</a>
</p>
<p>Nel frattempo, puoi visitare il nostro sito o contattarci direttamente a <strong>info@rescuemanager.eu</strong>.</p>
<p>Grazie,<br><strong>Il team RescueManager</strong></p>`;

      const confirmHtml = wrapTemplate(
        isDemo ? '✅ Richiesta Demo Ricevuta' : '✅ Messaggio Ricevuto',
        confirmBody
      );

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