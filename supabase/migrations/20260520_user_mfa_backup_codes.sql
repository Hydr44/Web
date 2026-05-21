-- P0 #2 — Backup codes 2FA reali (sostituiscono i fake hardcoded nel codice).
-- Codici monouso generati server-side, archiviati solo in SHA-256 (mai
-- in chiaro). L'utente li vede una sola volta alla generazione.

CREATE TABLE IF NOT EXISTS public.user_mfa_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_backup_codes_user
  ON public.user_mfa_backup_codes(user_id);

-- RLS: ogni utente vede/gestisce solo i propri codici. Le API admin usano
-- supabaseAdmin (service role) che bypassa RLS per la generazione.
ALTER TABLE public.user_mfa_backup_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_mfa_backup_codes'
      AND policyname = 'user_mfa_backup_codes_own'
  ) THEN
    CREATE POLICY user_mfa_backup_codes_own ON public.user_mfa_backup_codes
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

COMMENT ON TABLE public.user_mfa_backup_codes IS
  'Codici di backup 2FA monouso. Stored come SHA-256 hash; il plaintext non viene mai persistito.';
COMMENT ON COLUMN public.user_mfa_backup_codes.code_hash IS
  'SHA-256 hex digest del codice di backup.';
COMMENT ON COLUMN public.user_mfa_backup_codes.used_at IS
  'Timestamp di consumo del codice. NULL = ancora valido.';
