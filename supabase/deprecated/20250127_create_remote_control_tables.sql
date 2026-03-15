-- ============================================
-- REMOTE CONTROL TABLES
-- ============================================

-- Tabella manutenzione
CREATE TABLE IF NOT EXISTS public.maintenance_mode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT false,
  message text,
  started_at timestamp with time zone,
  started_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella versioni app
CREATE TABLE IF NOT EXISTS public.app_versions (
  version text PRIMARY KEY,
  min_required text NOT NULL,
  force_update boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella heartbeat
CREATE TABLE IF NOT EXISTS public.app_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  org_id uuid REFERENCES orgs(id),
  app_version text,
  online boolean DEFAULT true,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_org FOREIGN KEY (org_id) REFERENCES orgs(id)
);

-- RLS Disabled (come per OAuth)
ALTER TABLE public.maintenance_mode DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_heartbeats DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_heartbeats_user ON public.app_heartbeats(user_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_org ON public.app_heartbeats(org_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_last_seen ON public.app_heartbeats(last_seen);

-- Default maintenance: OFF
INSERT INTO public.maintenance_mode (is_active, message) 
VALUES (false, NULL)
ON CONFLICT DO NOTHING;

-- Default app version
INSERT INTO public.app_versions (version, min_required, force_update) 
VALUES ('0.1.0', '0.1.0', false)
ON CONFLICT (version) DO NOTHING;

