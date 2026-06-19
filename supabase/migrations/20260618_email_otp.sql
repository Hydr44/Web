-- =============================================================================
-- F5 — Verifica email con OTP all'ingresso del wizard (post-pagamento).
-- Conferma che chi procede controlla l'email del lead (anti-frode link inoltrato)
-- e dà un'email verificata per l'attivazione. Accesso SOLO via service_role.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.email_otp (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_uuid    text NOT NULL,            -- public_uuid del preventivo (il token)
  email         text NOT NULL,
  code_hash     text NOT NULL,            -- SHA-256 del codice a 6 cifre
  session_token text,                     -- impostato alla verifica → cookie per la ripresa
  expires_at    timestamptz NOT NULL,
  attempts      integer NOT NULL DEFAULT 0,
  verified_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otp_quote   ON public.email_otp (quote_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_otp_session ON public.email_otp (quote_uuid, session_token);

ALTER TABLE public.email_otp ENABLE ROW LEVEL SECURITY;
-- Nessuna policy: tabella sensibile, accessibile solo dal service_role (route website).
