-- P1 — Audit log utente, preferenze notifiche, session-log.
-- Sostituisce le 3 pagine mock di /dashboard/security/{audit,sessions} e
-- /dashboard/settings/notifications con persistenza reale.

------------------------------------------------------------------------------
-- 1) user_audit_logs — eventi sensibili relativi al proprio account utente
--    (login, cambio password, 2FA enable/disable, sessione revocata, ecc.)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,                 -- es. 'password.changed','mfa.enabled','session.revoked','login.success'
  status text NOT NULL DEFAULT 'success', -- 'success'|'failure'
  ip text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_created
  ON public.user_audit_logs(user_id, created_at DESC);

ALTER TABLE public.user_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_audit_logs' AND policyname='user_audit_logs_own_read'
  ) THEN
    CREATE POLICY user_audit_logs_own_read ON public.user_audit_logs
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  -- NB: INSERT solo via service-role (le API server-side scrivono gli eventi).
END$$;

COMMENT ON TABLE public.user_audit_logs IS
  'Log audit per-utente (eventi sensibili sul proprio account). Scritto da route API server-side.';

------------------------------------------------------------------------------
-- 2) user_preferences — preferenze utente (notifiche email/in-app, …)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications jsonb NOT NULL DEFAULT '{
    "security": true,
    "billing": true,
    "support": true,
    "product_updates": false,
    "marketing": false
  }'::jsonb,
  inapp_notifications jsonb NOT NULL DEFAULT '{
    "security": true,
    "billing": true,
    "support": true,
    "system": true
  }'::jsonb,
  locale text NOT NULL DEFAULT 'it',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_preferences_own'
  ) THEN
    CREATE POLICY user_preferences_own ON public.user_preferences
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

COMMENT ON TABLE public.user_preferences IS
  'Preferenze utente (notifiche email/in-app, locale). Un record per utente.';

------------------------------------------------------------------------------
-- 3) user_session_log — log human-readable delle sessioni (Supabase auth.sessions
--    è interno; ne facciamo una proiezione user-side con campi più utili).
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_session_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,                      -- id sessione di auth.sessions (se noto)
  ip text,
  user_agent text,
  device_label text,                    -- es. 'Chrome su macOS', 'iPhone'
  is_current boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_session_log_user
  ON public.user_session_log(user_id, last_seen_at DESC);

ALTER TABLE public.user_session_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_session_log' AND policyname='user_session_log_own_read'
  ) THEN
    CREATE POLICY user_session_log_own_read ON public.user_session_log
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END$$;

COMMENT ON TABLE public.user_session_log IS
  'Log sessioni utente human-readable (proiezione da auth.sessions con device/IP/last_seen).';
