// API endpoint di TEST per trasmissione fatture al Sistema di Interscambio (SDI)
// Endpoint: POST /api/sdi/test/trasmissione
// 
// Questo endpoint invia fatture elettroniche al SDI (ambiente TEST)
// Quando emetti una fattura, questo endpoint la invia al SDI di test

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSDIResponse } from '../../_utils';
import { sendInvoiceToSDI, generateSDIFileName } from '@/lib/sdi/soap-client';
import { generateFatturaPAXML, invoiceToFatturaPAData } from '@/lib/sdi/xml-generator';

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
    // Ricevi richiesta di trasmissione fattura (test)
    const body = await request.json();
    const { invoice_id, xml } = body;

    if (!invoice_id && !xml) {
      return createSDIResponse(
        { success: false, error: 'invoice_id o xml richiesto' },
        400
      );
    }

    console.log('[SDI TEST] Trasmissione fattura richiesta:', {
      invoice_id,
      xml_length: xml?.length,
      environment: 'TEST',
    });

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

    let invoice: any = null;
    let invoiceXml: string = xml;

    // Se invoice_id è fornito, recupera fattura dal database
    if (invoice_id) {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', invoice_id)
        .single();

      if (invoiceError || !invoiceData) {
        return createSDIResponse(
          { success: false, error: 'Fattura non trovata' },
          404
        );
      }

      invoice = invoiceData;

      // Se XML non è fornito, genera XML da fattura
      if (!invoiceXml && invoice) {
        // Recupera impostazioni organizzazione per dati cedente
        const { data: orgSettings } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', invoice.org_id)
          .single();

        // Genera XML FatturaPA
        const fatturaPAData = invoiceToFatturaPAData(invoice, orgSettings);
        invoiceXml = generateFatturaPAXML(fatturaPAData);
      }
    }

    if (!invoiceXml || invoiceXml.trim().length === 0) {
      return createSDIResponse(
        { success: false, error: 'XML fattura mancante o vuoto' },
        400
      );
    }

    // Genera nome file conforme SDI
    const vatNumber = invoice?.meta?.sdi?.cedente_prestatore?.id_fiscale_iva?.id_codice || '02166430856';
    const invoiceNumber = invoice?.number || '00001';
    const fileName = generateSDIFileName(vatNumber, invoiceNumber);

    // IMPORTANTE: Per l'ambiente TEST SDI, potrebbe essere necessario:
    // 1. Registrare gli endpoint sul portale SDI (https://www.fatturapa.gov.it/)
    // 2. Ottenere accesso all'ambiente test
    // 3. Configurare i certificati correttamente
    // 
    // Se tutti gli endpoint restituiscono 404, potrebbe significare:
    // - Gli endpoint non sono ancora registrati sul portale SDI
    // - L'URL dell'endpoint è errato
    // - Serve autenticazione/registrazione prima di poter inviare fatture
    
    console.log('[SDI TEST] ⚠️ ATTENZIONE: Prima di inviare fatture al SDI TEST, devi:');
    console.log('[SDI TEST] 1. Registrare gli endpoint sul portale SDI: https://www.fatturapa.gov.it/');
    console.log('[SDI TEST] 2. Configurare i certificati client in Vercel Secrets');
    console.log('[SDI TEST] 3. Verificare che l\'ambiente test sia accessibile');
    
    // Invia fattura al SDI TEST tramite web service SOAP
    const sdiResponse = await sendInvoiceToSDI(invoiceXml, fileName, 'test');

    if (!sdiResponse.success) {
      // Se tutti gli endpoint restituiscono 404, fornisci istruzioni chiare
      const is404Error = sdiResponse.error?.includes('404') || sdiResponse.error?.includes('Not Found');
      
      if (is404Error) {
        return createSDIResponse(
          {
            success: false,
            error: sdiResponse.error || 'Errore invio al SDI',
            message: `⚠️ ERRORE 404: Gli endpoint SDI non sono stati trovati.\n\n` +
                     `Questo potrebbe significare:\n` +
                     `1. Gli endpoint non sono ancora registrati sul portale SDI\n` +
                     `2. L'URL dell'endpoint è errato\n` +
                     `3. Serve registrazione sul portale SDI prima di poter inviare fatture\n\n` +
                     `Prossimi passi:\n` +
                     `- Vai su https://www.fatturapa.gov.it/\n` +
                     `- Registra gli endpoint nella sezione "Test di interoperabilità"\n` +
                     `- Verifica i certificati in Vercel Secrets\n\n` +
                     `Dettagli tecnici: ${sdiResponse.message || 'Nessun dettaglio disponibile'}`,
          },
          500
        );
      }
      
      return createSDIResponse(
        {
          success: false,
          error: sdiResponse.error || 'Errore invio al SDI',
          message: sdiResponse.message,
        },
        500
      );
    }

    // Aggiorna stato fattura
    if (invoice_id && sdiResponse.identificativoSDI) {
      await supabase
        .from('invoices')
        .update({
          sdi_status: 'sent',
          provider_ext_id: sdiResponse.identificativoSDI,
          meta: {
            sdi_sent: true,
            sdi_sent_at: new Date().toISOString(),
            sdi_xml: invoiceXml,
            sdi_environment: 'TEST',
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', invoice_id);

      // Registra evento SDI (test)
      await supabase.from('sdi_events').insert({
        invoice_id,
        event_type: 'TrasmissioneFattura_TEST',
        payload: {
          identificativo_sdi: sdiResponse.identificativoSDI,
          xml_length: invoiceXml.length,
          sent_at: new Date().toISOString(),
          environment: 'TEST',
        },
      });
    }

    console.log('[SDI TEST] Fattura trasmessa:', {
      invoice_id,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

    return createSDIResponse({
      success: true,
      message: sdiResponse.message || 'Fattura inviata al SDI (TEST)',
      invoice_id: invoice_id || null,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

  } catch (error: any) {
    console.error('[SDI TEST] Errore trasmissione fattura:', error);
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore trasmissione fattura',
      },
      500
    );
  }
}


      // Registra evento SDI (test)
      await supabase.from('sdi_events').insert({
        invoice_id,
        event_type: 'TrasmissioneFattura_TEST',
        payload: {
          identificativo_sdi: sdiResponse.identificativoSDI,
          xml_length: invoiceXml.length,
          sent_at: new Date().toISOString(),
          environment: 'TEST',
        },
      });
    }

    console.log('[SDI TEST] Fattura trasmessa:', {
      invoice_id,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

    return createSDIResponse({
      success: true,
      message: sdiResponse.message || 'Fattura inviata al SDI (TEST)',
      invoice_id: invoice_id || null,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

  } catch (error: any) {
    console.error('[SDI TEST] Errore trasmissione fattura:', error);
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore trasmissione fattura',
      },
      500
    );
  }
}


      // Registra evento SDI (test)
      await supabase.from('sdi_events').insert({
        invoice_id,
        event_type: 'TrasmissioneFattura_TEST',
        payload: {
          identificativo_sdi: sdiResponse.identificativoSDI,
          xml_length: invoiceXml.length,
          sent_at: new Date().toISOString(),
          environment: 'TEST',
        },
      });
    }

    console.log('[SDI TEST] Fattura trasmessa:', {
      invoice_id,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

    return createSDIResponse({
      success: true,
      message: sdiResponse.message || 'Fattura inviata al SDI (TEST)',
      invoice_id: invoice_id || null,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

  } catch (error: any) {
    console.error('[SDI TEST] Errore trasmissione fattura:', error);
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore trasmissione fattura',
      },
      500
    );
  }
}


      // Registra evento SDI (test)
      await supabase.from('sdi_events').insert({
        invoice_id,
        event_type: 'TrasmissioneFattura_TEST',
        payload: {
          identificativo_sdi: sdiResponse.identificativoSDI,
          xml_length: invoiceXml.length,
          sent_at: new Date().toISOString(),
          environment: 'TEST',
        },
      });
    }

    console.log('[SDI TEST] Fattura trasmessa:', {
      invoice_id,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

    return createSDIResponse({
      success: true,
      message: sdiResponse.message || 'Fattura inviata al SDI (TEST)',
      invoice_id: invoice_id || null,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

  } catch (error: any) {
    console.error('[SDI TEST] Errore trasmissione fattura:', error);
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore trasmissione fattura',
      },
      500
    );
  }
}

