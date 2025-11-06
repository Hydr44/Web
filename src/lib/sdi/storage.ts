// Utility per salvare file SDI su Supabase Storage

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Salva file XML su Supabase Storage
 */
export async function saveSDIFile(
  fileName: string,
  fileContent: Buffer,
  environment: 'TEST' | 'PRODUCTION'
): Promise<{ url: string; path: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Crea bucket se non esiste (solo se hai permessi)
  const bucketName = 'sdi-files';
  const folder = environment.toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${folder}/${timestamp}-${fileName}`;
  
  // Carica file su storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, fileContent, {
      contentType: fileName.endsWith('.p7m') ? 'application/pkcs7-mime' : 'application/xml',
      upsert: false, // Non sovrascrivere file esistenti
    });
  
  if (error) {
    console.error('[SDI Storage] Errore salvataggio file:', error);
    throw new Error(`Errore salvataggio file: ${error.message}`);
  }
  
  // Ottieni URL pubblico
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);
  
  return {
    url: urlData.publicUrl,
    path,
  };
}

/**
 * Salva SOAP envelope su Supabase Storage
 */
export async function saveSOAPEnvelope(
  soapEnvelope: string,
  fileName: string,
  environment: 'TEST' | 'PRODUCTION'
): Promise<{ url: string; path: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const bucketName = 'sdi-files';
  const folder = environment.toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${folder}/soap/${timestamp}-${fileName.replace(/\.(xml|p7m)$/, '.soap.xml')}`;
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, Buffer.from(soapEnvelope, 'utf8'), {
      contentType: 'application/xml',
      upsert: false,
    });
  
  if (error) {
    console.error('[SDI Storage] Errore salvataggio SOAP envelope:', error);
    throw new Error(`Errore salvataggio SOAP envelope: ${error.message}`);
  }
  
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);
  
  return {
    url: urlData.publicUrl,
    path,
  };
}

