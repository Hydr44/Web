-- Link di attivazione piano: admin genera link, cliente clicca
-- link_type: trial = attiva 7 giorni prova | purchase = redirect a checkout Stripe
CREATE TABLE IF NOT EXISTS public.plan_activation_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  plan text NOT NULL,
  modules text[] NOT NULL DEFAULT '{}',
  link_type text NOT NULL DEFAULT 'trial' CHECK (link_type IN ('trial', 'purchase')),
  trial_days integer DEFAULT 7 CHECK (trial_days IS NULL OR (trial_days >= 1 AND trial_days <= 90)),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_plan_activation_links_token ON public.plan_activation_links(token);
CREATE INDEX IF NOT EXISTS idx_plan_activation_links_org_id ON public.plan_activation_links(org_id);
CREATE INDEX IF NOT EXISTS idx_plan_activation_links_expires ON public.plan_activation_links(expires_at) WHERE used_at IS NULL;

ALTER TABLE public.plan_activation_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.plan_activation_links FOR ALL
  USING (true)
  WITH CHECK (true);
