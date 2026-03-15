-- Crea bucket storage per file SDI
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sdi-files',
  'sdi-files',
  false, -- Privato (solo accesso autenticato)
  52428800, -- 50MB (per file .xml.p7m grandi)
  ARRAY['application/xml', 'application/pkcs7-mime', 'text/xml', 'application/soap+xml']
) ON CONFLICT (id) DO NOTHING;

-- Policy: solo service role può caricare (per API)
CREATE POLICY "sdi_files_service_role_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sdi-files' AND
  auth.role() = 'service_role'
);

-- Policy: solo service role può leggere (per API)
CREATE POLICY "sdi_files_service_role_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sdi-files' AND
  auth.role() = 'service_role'
);

-- Policy: solo service role può eliminare (per API)
CREATE POLICY "sdi_files_service_role_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sdi-files' AND
  auth.role() = 'service_role'
);

