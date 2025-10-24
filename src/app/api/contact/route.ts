import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    const body = await request.json();
    const { name, email, phone, company, type, message, source = "website" } = body;

    // Validazione base
    if (!name || !email || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Crea nuovo lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        phone,
        company,
        type,
        status: "new",
        priority: "medium",
        source,
        notes: message
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    // Qui potresti inviare una notifica email allo staff
    // await sendNotificationEmail(lead);

    return NextResponse.json({ 
      success: true, 
      lead: { id: lead.id },
      message: "Richiesta inviata con successo. Ti contatteremo presto!"
    });
  } catch (error) {
    console.error("Error in contact API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
