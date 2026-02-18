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
      role,
      vehicles,
      message,
      additional_data
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
        role: role || null,
        vehicles: vehicles || null,
        message: sanitizedMessage,
        additional_data: additional_data || null,
        status: 'new',
        priority: type === 'quote' ? 'high' : 'medium',
        ip_address: ip,
        user_agent: userAgent
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

    // TODO: Send notification email to staff
    // TODO: Send confirmation email to customer

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