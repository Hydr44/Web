-- =============================================================================
-- Staff Auth Hardening — Fase 1 (schema)
-- Ref: docs/specs/staff-auth-secure-redesign.md
--
-- Idempotente e ADDITIVA: ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS,
-- vincoli creati solo se assenti. NON tocca gli account esistenti e NON rompe il
-- login attuale (che usa solo is_active + password_hash).
--
-- Applicare su STAGING (rqwdimgwtewrsintvwoe) e PROD (ienzdgrqalltvkdkuamp).
-- Schema di partenza verificato identico su entrambi (staff: 11 colonne).
-- =============================================================================

-- 1) staff: colonne per verifica email, ciclo di vita account, lockout ---------

-- password_hash diventa nullable: gli account creati via invito non hanno
-- ancora una password finché il nuovo staff non la imposta. (idempotente)
ALTER TABLE public.staff ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS status              text        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verified_at   timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by          uuid,
  ADD COLUMN IF NOT EXISTS password_set_at     timestamptz,
  ADD COLUMN IF NOT EXISTS failed_login_count  integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until        timestamptz;

-- CHECK stato ciclo di vita (solo se non già presente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_status_check') THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_status_check CHECK (status IN ('invited','active','suspended'));
  END IF;
END $$;

-- FK invited_by → staff(id) (chi ha invitato; SET NULL se l'invitante è rimosso)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_invited_by_fkey') THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_invited_by_fkey FOREIGN KEY (invited_by)
      REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill non distruttivo:
--   - account con password già impostata → password_set_at = created_at
UPDATE public.staff
   SET password_set_at = created_at
 WHERE password_hash IS NOT NULL AND password_set_at IS NULL;

--   - il primario aziendale è considerato verificato (email @rescuemanager.eu,
--     creato dal reset controllato del 2026-07-07)
UPDATE public.staff
   SET email_verified_at = now()
 WHERE email = 'emmanuel.scozzarini@rescuemanager.eu' AND email_verified_at IS NULL;

-- 2) staff_invites (modellata su org_invites) ---------------------------------
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('super_admin','admin','marketing','sales','support','staff')),
  full_name     text,
  invited_by    uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  token_hash    text NOT NULL,                    -- SHA-256 del token (mai il token in chiaro)
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  accepted_at   timestamptz,
  email_sent_at timestamptz,
  email_error   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Un solo invito 'pending' per email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS staff_invites_pending_email_uniq
  ON public.staff_invites (lower(email)) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS staff_invites_token_idx ON public.staff_invites (token_hash);
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
-- Nessuna policy: tabella sensibile, accessibile solo dal service_role (route backend).

-- 3) staff_otp (OTP step-up login + reset password + verifica email) -----------
CREATE TABLE IF NOT EXISTS public.staff_otp (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  purpose     text NOT NULL CHECK (purpose IN ('login','password_reset','email_verify')),
  code_hash   text NOT NULL,                      -- SHA-256 del codice 6 cifre (riusa otp.ts)
  expires_at  timestamptz NOT NULL,               -- +10 min (OTP_TTL_MS)
  attempts    integer NOT NULL DEFAULT 0,         -- max 5 (OTP_MAX_ATTEMPTS)
  consumed_at timestamptz,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_otp_lookup_idx ON public.staff_otp (staff_id, purpose, created_at DESC);
ALTER TABLE public.staff_otp ENABLE ROW LEVEL SECURITY;

-- 4) staff_trusted_devices ("ricorda questo dispositivo 7 giorni") -------------
CREATE TABLE IF NOT EXISTS public.staff_trusted_devices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  device_token_hash text NOT NULL,                -- SHA-256 del token nel cookie httpOnly firmato
  label             text,
  ip_address        text,
  user_agent        text,
  last_used_at      timestamptz,
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_trusted_devices_uniq UNIQUE (staff_id, device_token_hash)
);
CREATE INDEX IF NOT EXISTS staff_trusted_devices_lookup_idx
  ON public.staff_trusted_devices (staff_id, expires_at);
ALTER TABLE public.staff_trusted_devices ENABLE ROW LEVEL SECURITY;
