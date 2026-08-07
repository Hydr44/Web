-- 20260702_storage_drop_broad_list_policies.sql
--
-- SICUREZZA STORAGE — policy SELECT troppo larghe su storage.objects.
--
-- Supabase advisor: "A broad SELECT policy on storage.objects allows clients
-- to retrieve a full list of files. Public buckets don't need this."
-- Per un'app MULTI-TENANT è più grave: la SELECT era filtrata solo per
-- bucket_id (NESSUN filtro per org), quindi qualsiasi utente autenticato
-- (es. autista di un'altra azienda) poteva LISTARE e scaricare le foto di
-- TUTTE le org, non solo la sua.
--
-- PERCHÉ È SICURO RIMUOVERLE (nessuna manutenzione / downtime):
--   * i bucket sono PUBBLICI → le foto si mostrano via getPublicUrl (CDN
--     /object/public/...), che NON valuta le RLS. Display invariato.
--   * gli upload usano policy INSERT separate (non toccate qui).
--   * nessun punto dell'app usa .list() / .download() / createSignedUrl su
--     questi bucket (verificato su desktop + mobile + website).
-- Effetto: si blocca solo l'ENUMERAZIONE via API → per aprire una foto serve
-- già conoscere l'URL esatto (path con UUID casuale, non indovinabile).
--
-- NON toccato:
--   * sdi_files_service_role_read → bucket PRIVATO, solo service_role (giusto).
--   * yard-photos / documents → già SENZA policy SELECT (non listabili).
--
-- Idempotente. DEPLOY: PROD (ienzdgrqalltvkdkuamp) + STAGING (rqwdimgwtewrsintvwoe).

drop policy if exists company_assets_public_read      on storage.objects;
drop policy if exists demolitions_photos_public_read   on storage.objects;
drop policy if exists spare_parts_images_public_read    on storage.objects;
drop policy if exists transport_photos_read             on storage.objects;
