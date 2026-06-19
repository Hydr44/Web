-- =============================================================================
-- F5 — Hardening email_otp (cascade cleanup + integrità referenziale).
-- OPZIONALE: il codice NON dipende da questa migration; serve solo a igiene/retention.
-- Allinea quote_uuid al tipo canonico (uuid) e aggiunge ON DELETE CASCADE verso
-- lead_quotes(public_uuid), così le righe OTP (che contengono email in chiaro +
-- session_token) spariscono quando il preventivo/lead viene eliminato.
-- Idempotente: rieseguibile senza errori.
-- =============================================================================
DO $$
BEGIN
  -- 1) Allinea il tipo a uuid (i valori inseriti dalle route sono sempre public_uuid validi).
  IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'email_otp' AND column_name = 'quote_uuid') = 'text' THEN
    -- Rimuovi prima eventuali righe orfane o con uuid non valido (sicurezza pre-ALTER).
    DELETE FROM public.email_otp e
     WHERE e.quote_uuid !~ '^[0-9a-fA-F-]{36}$'
        OR NOT EXISTS (SELECT 1 FROM public.lead_quotes q WHERE q.public_uuid::text = e.quote_uuid);
    ALTER TABLE public.email_otp ALTER COLUMN quote_uuid TYPE uuid USING quote_uuid::uuid;
  END IF;

  -- 2) FK con ON DELETE CASCADE (public_uuid è UNIQUE → valido come target FK).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_otp_quote_fk') THEN
    ALTER TABLE public.email_otp
      ADD CONSTRAINT email_otp_quote_fk
      FOREIGN KEY (quote_uuid) REFERENCES public.lead_quotes (public_uuid) ON DELETE CASCADE;
  END IF;
END $$;
