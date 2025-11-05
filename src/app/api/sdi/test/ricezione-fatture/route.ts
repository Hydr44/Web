// API endpoint di TEST per ricezione fatture dal Sistema di Interscambio (SDI)
// Endpoint: POST /api/sdi/test/ricezione-fatture
// 
// Questo endpoint è per l'ambiente di TEST del SDI
// Non deve essere usato in produzione

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSDIResponse, parseSDIXML } from '../../_utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gestisce richieste OPTIONS per CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Ricevi XML fattura dal SDI (ambiente di test)
    const contentType = request.headers.get('content-type') || '';
    
    let xml: string;
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xml = await request.text();
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      xml = body.xml || body.fattura || JSON.stringify(body);
    } else {
      xml = await request.text();
    }

    if (!xml || xml.trim().length === 0) {
      return createSDIResponse(
        { success: false, error: 'XML fattura mancante o vuoto' },
        400
      );
    }

    console.log('[SDI TEST] Ricezione fattura ricevuta:', {
      length: xml.length,
      preview: xml.substring(0, 200),
      environment: 'TEST',
    });

    // Parse XML fattura
    const fatturaData = parseSDIXML(xml);

    // Inizializza Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[SDI TEST] Credenziali Supabase mancanti');
      return createSDIResponse(
        { success: false, error: 'Configurazione server errata' },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Cerca fattura esistente per numero e partita IVA
    let invoiceId: string | null = null;
    
    if (fatturaData.numero && fatturaData.partitaIva) {
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('number', fatturaData.numero)
        .eq('client_vat_number', fatturaData.partitaIva)
        .single();

      if (existingInvoice) {
        invoiceId = existingInvoice.id;
      }
    }

    // Se non esiste, crea nuova fattura ricevuta (test)
    if (!invoiceId) {
      const { data: newInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          type: 'received',
          number: fatturaData.numero || `SDI-TEST-${Date.now()}`,
          date: fatturaData.data || new Date().toISOString().split('T')[0],
          client_vat_number: fatturaData.partitaIva,
          sdi_status: 'received',
          meta: {
            sdi_received: true,
            sdi_received_at: new Date().toISOString(),
            sdi_xml: xml,
            sdi_data: fatturaData,
            sdi_environment: 'TEST',
          },
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[SDI TEST] Errore inserimento fattura:', insertError);
        return createSDIResponse(
          { success: false, error: 'Errore salvataggio fattura' },
          500
        );
      }

      invoiceId = newInvoice.id;
    } else {
      // Aggiorna fattura esistente
      await supabase
        .from('invoices')
        .update({
          sdi_status: 'received',
          meta: {
            sdi_received: true,
            sdi_received_at: new Date().toISOString(),
            sdi_xml: xml,
            sdi_data: fatturaData,
            sdi_environment: 'TEST',
          },
        })
        .eq('id', invoiceId);
    }

    // Registra evento SDI (test)
    await supabase.from('sdi_events').insert({
      invoice_id: invoiceId,
      event_type: 'RicezioneFattura_TEST',
      payload: {
        xml_length: xml.length,
        fattura_data: fatturaData,
        received_at: new Date().toISOString(),
        environment: 'TEST',
      },
    });

    console.log('[SDI TEST] Fattura ricevuta salvata:', { invoice_id: invoiceId });

    return createSDIResponse({
      success: true,
      message: 'Fattura ricevuta e salvata con successo (TEST)',
      invoice_id: invoiceId,
    });

  } catch (error: any) {
    console.error('[SDI TEST] Errore ricezione fattura:', error);
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore elaborazione fattura',
      },
      500
    );
  }
}

