import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
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

    // Create lead in database
    const { data: lead, error } = await supabaseAdmin()
      .from('leads')
      .insert({
        type,
        source,
        name,
        email,
        phone: phone || null,
        company: company || null,
        role: role || null,
        vehicles: vehicles || null,
        message: message || null,
        additional_data: additional_data || null,
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