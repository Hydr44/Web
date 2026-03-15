-- Migration: Dati Aziendali su Leads + Company Settings + Onboarding
-- Created: 2026-03-17

-- =====================================================
-- 1. CAMPI AZIENDALI SU LEADS
-- =====================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS vat_number         TEXT,
  ADD COLUMN IF NOT EXISTS codice_fiscale     TEXT,
  ADD COLUMN IF NOT EXISTS pec                TEXT,
  ADD COLUMN IF NOT EXISTS address_street     TEXT,
  ADD COLUMN IF NOT EXISTS address_city       TEXT,
  ADD COLUMN IF NOT EXISTS address_province   TEXT,
  ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS forma_giuridica    TEXT,
  ADD COLUMN IF NOT EXISTS codice_ateco       TEXT;

COMMENT ON COLUMN leads.vat_number          IS 'Partita IVA (es. IT12345678901)';
COMMENT ON COLUMN leads.codice_fiscale      IS 'Codice Fiscale azienda';
COMMENT ON COLUMN leads.pec                 IS 'Indirizzo PEC';
COMMENT ON COLUMN leads.address_street      IS 'Via e numero civico';
COMMENT ON COLUMN leads.address_city        IS 'Città';
COMMENT ON COLUMN leads.address_province    IS 'Provincia (2 lettere)';
COMMENT ON COLUMN leads.address_postal_code IS 'CAP';
COMMENT ON COLUMN leads.forma_giuridica     IS 'Forma giuridica: SRL, SNC, SAS, SPA, Ind., etc.';
COMMENT ON COLUMN leads.codice_ateco        IS 'Codice ATECO attività';

-- =====================================================
-- 2. CAMPI AGGIUNTIVI SU COMPANY_SETTINGS
-- =====================================================

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS codice_fiscale     TEXT,
  ADD COLUMN IF NOT EXISTS pec                TEXT,
  ADD COLUMN IF NOT EXISTS forma_giuridica    TEXT,
  ADD COLUMN IF NOT EXISTS codice_ateco       TEXT,
  ADD COLUMN IF NOT EXISTS iban               TEXT,
  ADD COLUMN IF NOT EXISTS sdi_recipient_code TEXT;

COMMENT ON COLUMN company_settings.sdi_recipient_code IS 'Codice destinatario SdI per ricezione fatture elettroniche';

-- =====================================================
-- 3. FLAG ONBOARDING SU PROFILES
-- =====================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.onboarding_completed IS 'True dopo che il cliente ha completato il wizard di onboarding post-pagamento';
