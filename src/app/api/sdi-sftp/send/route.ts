/**
 * API Route per invio fatture via SFTP SDI
 * POST /api/sdi-sftp/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleCors, corsHeaders } from '@/lib/cors';
import AdmZip from 'adm-zip';
import { SDISFTPClient } from '@/lib/sdi-sftp/client';
import { generateFIFilename } from '@/lib/sdi-sftp/utils';
import { signFile, encryptFile } from '@/lib/sdi-sftp/crypto';
import { join } from 'path';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { tmpdir } from 'os';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Configurazione SFTP SDI
const SFTP_CONFIG = {
  host: process.env.SDI_SFTP_HOST || '217.154.118.37',
  port: parseInt(process.env.SDI_SFTP_PORT || '22', 10),
  username: process.env.SDI_SFTP_USERNAME || 'sdi',
  privateKey: process.env.SDI_SFTP_PRIVATE_KEY, // Chiave SSH privata
  testMode: process.env.SDI_SFTP_TEST_MODE === 'true',
};

// Path certificati (da configurare su server)
const CERT_PATHS = {
  firma: process.env.SDI_CERT_FIRMA_PATH || '/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12',
  cifra: process.env.SDI_CERT_CIFRA_PATH || '/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12',
  sogeiPublic: process.env.SDI_CERT_SOGEI_PUBLIC_PATH || '/opt/sdi-certs/sogeiunicocifra.pem',
  password: process.env.SDI_CERT_PASSWORD || 'IBVvOZqq',
};

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

/**
 * POST /api/sdi-sftp/send
 * Invia una o più fatture via SFTP SDI
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const { invoice_ids, org_id, test_mode } = body;

    if (!invoice_ids || !Array.isArray(invoice_ids) || invoice_ids.length === 0) {
      return NextResponse.json(
        { error: 'invoice_ids array richiesto' },
        { status: 400, headers }
      );
    }

    if (!org_id) {
      return NextResponse.json(
        { error: 'org_id richiesto' },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const useTestMode = test_mode ?? SFTP_CONFIG.testMode;

    // Carica fatture da database
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .in('id', invoice_ids)
      .eq('org_id', org_id);

    if (invoicesError || !invoices || invoices.length === 0) {
      return NextResponse.json(
        { error: 'Fatture non trovate', details: invoicesError?.message },
        { status: 404, headers }
      );
    }

    // TODO: Generare XML fatture (FatturaPA 1.2.2)
    // Per ora, creiamo XML semplificato
    const xmlFiles: Array<{ filename: string; content: string }> = [];
    
    for (const invoice of invoices) {
      // Genera XML fattura (da implementare completamente)
      const xmlContent = generateInvoiceXML(invoice);
      xmlFiles.push({
        filename: `IT${invoice.meta?.sdi?.cedente_prestatore?.id_paese || 'IT'}${invoice.meta?.sdi?.cedente_prestatore?.id_codice || ''}_${invoice.number || invoice.id}.xml`,
        content: xmlContent,
      });
    }

    // Crea ZIP con XML fatture
    const zip = new AdmZip();
    xmlFiles.forEach(({ filename, content }) => {
      zip.addFile(filename, Buffer.from(content, 'utf8'));
    });

    const zipBuffer = zip.toBuffer();

    // Firma e cifra file ZIP
    const tempDir = tmpdir();
    const tempZipPath = join(tempDir, `sdi-temp-${Date.now()}.zip`);
    const tempSignedPath = join(tempDir, `sdi-temp-signed-${Date.now()}.p7m`);
    const tempEncryptedPath = join(tempDir, `sdi-temp-encrypted-${Date.now()}.zip`);

    try {
      writeFileSync(tempZipPath, zipBuffer);
      
      // Firma file
      const signedBuffer = await signFile(tempZipPath, CERT_PATHS.firma, CERT_PATHS.password);
      writeFileSync(tempSignedPath, signedBuffer);
      
      // Cifra file
      const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
      writeFileSync(tempEncryptedPath, encryptedBuffer);

      // Genera nome file secondo convenzione SDI
      // TODO: Recuperare IdNodo da configurazione org
      const idNodo = 'SCZMNL05L21D960T'; // Da configurazione
      const progressivo = 1; // TODO: Gestire progressivo incrementale
      const filename = generateFIFilename(idNodo, progressivo, useTestMode);

      // Upload via SFTP
      const sftpClient = new SDISFTPClient({
        ...SFTP_CONFIG,
        testMode: useTestMode,
      });

      await sftpClient.connect();
      const remotePath = `${sftpClient.getUploadDirectory()}/${filename}`;
      await sftpClient.uploadFile(tempEncryptedPath, remotePath);
      await sftpClient.disconnect();

      // Cleanup file temporanei
      unlinkSync(tempZipPath);
      unlinkSync(tempSignedPath);
      unlinkSync(tempEncryptedPath);

      // Aggiorna stato fatture
      await supabase
        .from('invoices')
        .update({
          sdi_status: 'sent',
          meta: {
            ...invoices[0].meta,
            sdi_sftp_filename: filename,
            sdi_sftp_sent_at: new Date().toISOString(),
            sdi_sftp_test_mode: useTestMode,
          },
        })
        .in('id', invoice_ids);

      return NextResponse.json(
        {
          success: true,
          filename,
          invoices_sent: invoice_ids.length,
          test_mode: useTestMode,
        },
        { status: 200, headers }
      );

    } catch (error: any) {
      // Cleanup in caso di errore
      try {
        if (readFileSync(tempZipPath)) unlinkSync(tempZipPath);
      } catch {}
      try {
        if (readFileSync(tempSignedPath)) unlinkSync(tempSignedPath);
      } catch {}
      try {
        if (readFileSync(tempEncryptedPath)) unlinkSync(tempEncryptedPath);
      } catch {}

      throw error;
    }

  } catch (error: any) {
    console.error('[SDI-SFTP-SEND] Errore:', error);
    return NextResponse.json(
      { error: 'Errore invio SFTP', details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * Genera XML fattura FatturaPA 1.2.2 (semplificato)
 * TODO: Implementare generazione completa conforme FatturaPA
 */
function generateInvoiceXML(invoice: any): string {
  // Placeholder - da implementare generazione XML completa
  const meta = invoice.meta || {};
  const sdi = meta.sdi || {};
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12" xmlns="http://www.fatturapa.gov.it/sdi/fatturapa/v1.2">
  <FatturaElettronicaHeader>
    <!-- TODO: Implementare header completo -->
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <!-- TODO: Implementare body completo -->
  </FatturaElettronicaBody>
</FatturaElettronica>`;
}

