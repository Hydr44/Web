/**
 * API Route per invio email fattura
 * POST /api/invoices/[id]/send-email
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { id: invoiceId } = params;
    const body = await request.json();
    const { org_id } = body;

    if (!invoiceId || !org_id) {
      return NextResponse.json(
        { error: "invoice_id e org_id richiesti" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Carica fattura
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", invoiceId)
      .eq("org_id", org_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Fattura non trovata" },
        { status: 404, headers }
      );
    }

    // Verifica che la fattura sia stata consegnata
    if (invoice.sdi_status !== "delivered") {
      return NextResponse.json(
        { error: "La fattura deve essere consegnata prima di inviare l'email" },
        { status: 400, headers }
      );
    }

    // Carica dati azienda
    const { data: orgSettings } = await supabase
      .from("org_settings")
      .select("value")
      .eq("org_id", org_id)
      .eq("key", "company")
      .single();

    const companyData = orgSettings?.value || {};

    // Genera PDF (qui potresti usare una libreria come puppeteer o jsPDF)
    // Per ora creiamo un record in outbox_emails per l'invio asincrono
    const customerEmail = invoice.customer_address?.email || 
                         invoice.meta?.customer_email || 
                         null;

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Email cliente non disponibile" },
        { status: 400, headers }
      );
    }

    // Crea record in outbox_emails
    const { data: emailRecord, error: emailError } = await supabase
      .from("outbox_emails")
      .insert({
        org_id: org_id,
        to_addr: customerEmail,
        subject: `Fattura ${invoice.number || invoiceId.substring(0, 8)} - ${companyData.name || 'RescueManager'}`,
        body: `
Gentile Cliente,

In allegato trova la fattura n. ${invoice.number || 'N/A'} del ${invoice.date || 'N/A'}.

Dettagli:
- Importo: €${Number(invoice.total || 0).toFixed(2)}
- Cliente: ${invoice.customer_name || 'N/A'}

Cordiali saluti,
${companyData.name || 'RescueManager'}
        `.trim(),
        attachments: JSON.stringify([
          {
            filename: `fattura_${invoice.number || invoiceId}.pdf`,
            url: invoice.pdf_url || null,
            type: 'application/pdf'
          }
        ]),
        status: 'queued'
      })
      .select()
      .single();

    if (emailError) {
      console.error("[INVOICE-EMAIL] Errore creazione email:", emailError);
      return NextResponse.json(
        { error: "Errore nella creazione dell'email", details: emailError.message },
        { status: 500, headers }
      );
    }

    // TODO: Qui potresti integrare un servizio email reale (es. SendGrid, Resend, SMTP)
    // Per ora l'email è in coda nella tabella outbox_emails

    return NextResponse.json(
      {
        success: true,
        message: "Email aggiunta alla coda di invio",
        email_id: emailRecord.id
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[INVOICE-EMAIL] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}
