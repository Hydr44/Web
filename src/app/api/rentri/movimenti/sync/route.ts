/**
 * API Route: Sincronizza Movimenti da RENTRI
 * POST /api/rentri/movimenti/sync
 * 
 * Recupera i movimenti dai registri RENTRI e li sincronizza nel database locale
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic, generateRentriJWTIntegrity } from "@/lib/rentri/jwt-dynamic";
import { createHash } from "crypto";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENTRI_BASE_URL = process.env.RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { org_id, registro_id } = await request.json();
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Recupera certificato RENTRI per l'organizzazione
    const { data: cert, error: certError } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", org_id)
      .eq("environment", "demo")
      .eq("is_active", true)
      .eq("is_default", true)
      .single();
    
    if (certError || !cert) {
      return NextResponse.json(
        { error: "Certificato RENTRI non trovato per questa organizzazione" },
        { status: 404, headers }
      );
    }
    
    // 2. Recupera registri con rentri_id
    let registriQuery = supabase
      .from("rentri_registri")
      .select("id, rentri_id, anno, numero_registro")
      .eq("org_id", org_id)
      .not("rentri_id", "is", null);
    
    if (registro_id) {
      registriQuery = registriQuery.eq("id", registro_id);
    }
    
    const { data: registri, error: registriError } = await registriQuery;
    
    if (registriError) {
      return NextResponse.json(
        { error: "Errore recupero registri", details: registriError },
        { status: 500, headers }
      );
    }
    
    if (!registri || registri.length === 0) {
      return NextResponse.json(
        { error: "Nessun registro con identificativo RENTRI trovato" },
        { status: 404, headers }
      );
    }
    
    // 3. Per ogni registro, recupera movimenti da RENTRI
    const movimentiSincronizzati = [];
    const errori = [];
    
    for (const registro of registri) {
      try {
        console.log(`[RENTRI-MOVIMENTI] Sincronizzazione registro ${registro.rentri_id}...`);
        
        // Genera JWT per autenticazione (pattern AgID ID_AUTH_REST_02)
        const jwtAuth = await generateRentriJWTDynamic({
          issuer: cert.cf_operatore,
          certificatePem: cert.certificate_pem,
          privateKeyPem: cert.private_key_pem,
          audience: 'rentrigov.demo.api',
        });
        
        // Chiama RENTRI per recuperare movimenti
        const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/operatore/${registro.rentri_id}/movimenti`;
        
        // Paginazione: recupera tutte le pagine
        let page = 1;
        let hasMore = true;
        let totalMovimenti = 0;
        
        while (hasMore) {
          // Per GET, RENTRI richiede solo Authorization Bearer (non serve Digest)
          const response = await fetch(rentriUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwtAuth}`,
              'Accept': 'application/json',
              'Paging-Page': page.toString(),
              'Paging-PageSize': '100',
            },
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[RENTRI-MOVIMENTI] Errore RENTRI (${response.status}):`, errorText);
            throw new Error(`RENTRI API error: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          
          // RENTRI restituisce un array di movimenti
          const movimenti = Array.isArray(data) ? data : (data.items || data.movimenti || []);
          
          if (movimenti.length === 0) {
            hasMore = false;
            break;
          }
          
          // Sincronizza ogni movimento nel database
          for (const movimentoRentri of movimenti) {
            try {
              // Mappa i dati RENTRI al formato locale
              const movimentoLocale = mapRentriMovimentoToLocal(movimentoRentri, registro.id, org_id);
              
              // Upsert nel database (aggiorna se esiste già, altrimenti crea)
              // Usa (registro_id, anno, progressivo) come conflict key se rentri_id non è unico
              const { error: upsertError } = await supabase
                .from("rentri_movimenti")
                .upsert(movimentoLocale, {
                  onConflict: 'registro_id,anno,progressivo',
                  ignoreDuplicates: false,
                });
              
              if (upsertError) {
                console.error(`[RENTRI-MOVIMENTI] Errore upsert movimento:`, upsertError);
                errori.push({
                  registro: registro.rentri_id,
                  movimento: movimentoRentri.identificativo_movimento || 'N/A',
                  errore: upsertError.message,
                });
              } else {
                totalMovimenti++;
              }
            } catch (err: any) {
              console.error(`[RENTRI-MOVIMENTI] Errore mapping movimento:`, err);
              errori.push({
                registro: registro.rentri_id,
                movimento: 'N/A',
                errore: err.message,
              });
            }
          }
          
          // Controlla se ci sono altre pagine
          // Header di risposta RENTRI: Paging-PageCount, Paging-Page, Paging-PageSize, Paging-TotalRecordCount
          const totalPages = parseInt(response.headers.get('Paging-PageCount') || '1');
          const currentPageSize = parseInt(response.headers.get('Paging-PageSize') || '100');
          
          if (page >= totalPages || movimenti.length < currentPageSize) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        movimentiSincronizzati.push({
          registro_id: registro.id,
          registro_rentri_id: registro.rentri_id,
          movimenti_sincronizzati: totalMovimenti,
        });
        
        console.log(`[RENTRI-MOVIMENTI] Registro ${registro.rentri_id}: ${totalMovimenti} movimenti sincronizzati`);
        
      } catch (err: any) {
        console.error(`[RENTRI-MOVIMENTI] Errore sincronizzazione registro ${registro.rentri_id}:`, err);
        errori.push({
          registro: registro.rentri_id,
          movimento: 'N/A',
          errore: err.message || 'Errore sconosciuto',
        });
      }
    }
    
    return NextResponse.json(
      {
        success: true,
        registri_sincronizzati: movimentiSincronizzati.length,
        movimenti_sincronizzati: movimentiSincronizzati.reduce((sum, r) => sum + r.movimenti_sincronizzati, 0),
        dettagli: movimentiSincronizzati,
        errori: errori.length > 0 ? errori : undefined,
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-MOVIMENTI] Errore sincronizzazione:", error);
    return NextResponse.json(
      { error: error.message || "Errore durante la sincronizzazione" },
      { status: 500, headers }
    );
  }
}

/**
 * Mappa un movimento RENTRI (DatiMovimentoModel) al formato locale
 * 
 * Struttura RENTRI:
 * - riferimenti: DatiRiferimentiCompletoModel
 *   - numero_registrazione: IdentificativoMovimentoCompletoModel (anno, progressivo, identificativo)
 *   - data_ora_registrazione: ISO 8601 UTC
 *   - causale_operazione: CausaliOperazione
 * - rifiuto: DatiRifiutoModel
 *   - codice_eer: string
 *   - descrizione_eer: string (opzionale)
 *   - quantita: UnitaMisuraQuantitaModel (valore, unita_misura)
 *   - stato_fisico: StatiFisici
 *   - provenienza: ProvenienzaRifiuto
 *   - caratteristiche_pericolo: array
 */
function mapRentriMovimentoToLocal(movimentoRentri: any, registroId: string, orgId: string) {
  // Estrai riferimenti (DatiRiferimentiCompletoModel)
  const riferimenti = movimentoRentri.riferimenti || {};
  const numeroRegistrazione = riferimenti.numero_registrazione || {};
  
  // Estrai anno, progressivo e identificativo RENTRI
  const anno = numeroRegistrazione.anno || 
               movimentoRentri.anno || 
               new Date().getFullYear();
  const progressivo = numeroRegistrazione.progressivo || 
                     movimentoRentri.progressivo || 
                     0;
  const rentriId = numeroRegistrazione.identificativo || 
                   movimentoRentri.identificativo ||
                   null; // Se non c'è identificativo, sarà null (movimento non ancora trasmesso)
  
  // Estrai data/ora registrazione (obbligatoria in DatiRiferimentiCompletoModel)
  const dataOraRegistrazione = riferimenti.data_ora_registrazione || 
                               movimentoRentri.data_ora_registrazione ||
                               new Date().toISOString();
  
  // Estrai causale operazione
  const causale = riferimenti.causale_operazione || 
                 movimentoRentri.causale_operazione || 
                 movimentoRentri.causale ||
                 'aT';
  
  // Determina tipo operazione dalla causale
  let tipoOperazione = 'carico';
  if (causale) {
    // Causali di scarico: "PS" (Prelievo da sito), "GI" (Giacenza iniziale), "T*" (Trasporto con scarico)
    if (['PS', 'GI', 'T*'].includes(causale)) {
      tipoOperazione = 'scarico';
    }
    // Causali di carico: "aT" (arrivo trasporto), "TR" (Trasporto)
    else if (['aT', 'TR'].includes(causale)) {
      tipoOperazione = 'carico';
    }
    // Causale "M" = Materiali (impianti) - non ha rifiuto
    // Causale "T*AT" = Trasporto con arrivo e scarico - può essere sia carico che scarico
  }
  
  // Estrai dati rifiuto (DatiRifiutoModel)
  const rifiuto = movimentoRentri.rifiuto || {};
  
  // Estrai quantità (UnitaMisuraQuantitaModel: {valore: number, unita_misura: string})
  const quantita = rifiuto.quantita || {};
  const quantitaValore = quantita.valore || 0;
  const unitaMisura = quantita.unita_misura || 'kg';
  
  // Estrai integrazione FIR (se presente)
  const integrazioneFir = movimentoRentri.integrazione_fir || {};
  
  // Estrai esito conferimento (se presente)
  const esito = movimentoRentri.esito || {};
  
  return {
    org_id: orgId,
    registro_id: registroId,
    rentri_id: rentriId, // Identificativo RENTRI (pattern: ^M[0-9A-Z]{19}$)
    anno: anno,
    progressivo: progressivo,
    data_ora_registrazione: dataOraRegistrazione,
    data_operazione: dataOraRegistrazione.split('T')[0], // Solo data per data_operazione
    causale_operazione: causale,
    tipo_operazione: tipoOperazione,
    codice_eer: rifiuto.codice_eer || '170101',
    descrizione_eer: rifiuto.descrizione_eer || '',
    quantita: quantitaValore,
    unita_misura: unitaMisura,
    provenienza: rifiuto.provenienza || null,
    stato_fisico: rifiuto.stato_fisico || null,
    caratteristiche_pericolo: Array.isArray(rifiuto.caratteristiche_pericolo) 
      ? rifiuto.caratteristiche_pericolo 
      : (rifiuto.caratteristiche_pericolo ? [rifiuto.caratteristiche_pericolo] : []),
    // Integrazione FIR
    numero_fir: integrazioneFir.numero_fir || null,
    data_inizio_trasporto: integrazioneFir.data_inizio_trasporto || null,
    data_fine_trasporto: esito.data_fine_trasporto || null,
    peso_verificato_destino: esito.peso_verificato_destino || null,
    // Annotazioni
    annotazioni: movimentoRentri.annotazioni || '',
    note: '', // Note interne (non da RENTRI)
    // Stato sincronizzazione
    sync_status: 'synced',
    sync_at: new Date().toISOString(),
  };
}

