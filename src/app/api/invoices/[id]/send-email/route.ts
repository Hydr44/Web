/**
 * API Route per invio email fattura
 * POST /api/invoices/[id]/send-email
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase-server";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type InvoiceRow = {
  id: string;
  number: string | null;
  date: string | null;
  total: number | null;
  customer_name: string | null;
  customer_address: { email?: string } | null;
  meta: { customer_email?: string } | null;
  pdf_url: string | null;
  sdi_status: string | null;
};

type CompanyData = { name?: string };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return 'Unknown error'; }
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

async function authorizeOrgMember(orgId: string) {
  const userClient = await supabaseServer();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return { ok: false as const, status: 401, error: "Non autorizzato" };

  const { data: membership } = await userClient
    .from("org_members")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return { ok: false as const, status: 403, error: "Non autorizzato per questa organizzazione" };
  return { ok: true as const, user };
}

function buildEmailContent(invoice: InvoiceRow, companyData: CompanyData) {
  const subject = `Fattura ${invoice.number || invoice.id.substring(0, 8)} - ${companyData.name || 'RescueManager'}`;
  const textBody = `
Gentile Cliente,

In allegato trova la fattura n. ${invoice.number || 'N/A'} del ${invoice.date || 'N/A'}.

Dettagli:
- Importo: €${Number(invoice.total || 0).toFixed(2)}
- Cliente: ${invoice.customer_name || 'N/A'}

Cordiali saluti,
${companyData.name || 'RescueManager'}
  `.trim();
  return { subject, textBody };
}

async function sendViaResend(args: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  textBody: string;
  pdfUrl: string | null;
  filename: string;
}) {
  const html = args.textBody.replaceAll('\n', '<br>');
  const resendBody: Record<string, unknown> = {
    from: args.from,
    to: args.to,
    subject: args.subject,
    html,
  };
  if (args.pdfUrl) {
    resendBody.attachments = [{ filename: args.filename, path: args.pdfUrl }];
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${args.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(resendBody),
  });

  if (r.ok) return { ok: true as const };
  const errorText = await r.text();
  return { ok: false as const, error: `Resend ${r.status}: ${errorText}` };
}

async function dispatchEmail(
  supabase: SupabaseClient,
  emailId: string,
  invoice: InvoiceRow,
  companyData: CompanyData,
  customerEmail: string,
  subject: string,
  textBody: string
): Promise<'sent' | 'queued'> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 'queued';

  const filename = `fattura_${invoice.number || invoice.id}.pdf`;
  const fromName = companyData.name || 'RescueManager';

  try {
    const result = await sendViaResend({
      apiKey,
      from: `${fromName} <noreply@rescuemanager.eu>`,
      to: customerEmail,
      subject,
      textBody,
      pdfUrl: invoice.pdf_url,
      filename,
    });

    if (result.ok) {
      await supabase
        .from('outbox_emails')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', emailId);
      return 'sent';
    }

    console.error('[INVOICE-EMAIL] Resend KO:', result.error);
    await supabase
      .from('outbox_emails')
      .update({ status: 'failed', error: result.error })
      .eq('id', emailId);
    return 'queued';
  } catch (err: unknown) {
    console.error('[INVOICE-EMAIL] Resend network error:', errorMessage(err));
    return 'queued';
  }
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
      return NextResponse.json({ error: "invoice_id e org_id richiesti" }, { status: 400, headers });
    }

    const auth = await authorizeOrgMember(org_id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", invoiceId)
      .eq("org_id", org_id)
      .single<InvoiceRow>();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Fattura non trovata" }, { status: 404, headers });
    }

    if (invoice.sdi_status !== "delivered") {
      return NextResponse.json(
        { error: "La fattura deve essere consegnata prima di inviare l'email" },
        { status: 400, headers }
      );
    }

    const { data: orgSettings } = await supabase
      .from("org_settings")
      .select("value")
      .eq("org_id", org_id)
      .eq("key", "company")
      .single();

    const companyData: CompanyData = orgSettings?.value || {};
    const customerEmail = invoice.customer_address?.email || invoice.meta?.customer_email || null;

    if (!customerEmail) {
      return NextResponse.json({ error: "Email cliente non disponibile" }, { status: 400, headers });
    }

    const { subject, textBody } = buildEmailContent(invoice, companyData);

    const { data: emailRecord, error: emailError } = await supabase
      .from("outbox_emails")
      .insert({
        org_id,
        to_addr: customerEmail,
        subject,
        body: textBody,
        attachments: JSON.stringify([{
          filename: `fattura_${invoice.number || invoiceId}.pdf`,
          url: invoice.pdf_url || null,
          type: 'application/pdf',
        }]),
        status: 'queued',
      })
      .select()
      .single();

    if (emailError) {
      console.error("[INVOICE-EMAIL] Errore creazione record outbox:", emailError);
      return NextResponse.json(
        { error: "Errore nella creazione dell'email", details: emailError.message },
        { status: 500, headers }
      );
    }

    const sendStatus = await dispatchEmail(
      supabase, emailRecord.id, invoice, companyData, customerEmail, subject, textBody
    );

    return NextResponse.json(
      {
        success: true,
        message: sendStatus === 'sent' ? "Email inviata" : "Email aggiunta alla coda di invio",
        email_id: emailRecord.id,
        status: sendStatus,
      },
      { status: 200, headers }
    );
  } catch (error: unknown) {
    const message = errorMessage(error);
    console.error("[INVOICE-EMAIL] Errore:", message);
    return NextResponse.json({ error: "Errore interno", details: message }, { status: 500, headers });
  }
}
