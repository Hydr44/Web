-- ============================================
-- ADD DOWNLOAD URL TO APP VERSIONS
-- ============================================

-- Aggiungi colonna download_url alla tabella app_versions
ALTER TABLE public.app_versions 
  ADD COLUMN IF NOT EXISTS download_url text;

