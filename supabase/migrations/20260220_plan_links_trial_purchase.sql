-- Per DB già migrati con 20260215 (senza link_type): aggiungi colonne trial/purchase
ALTER TABLE public.plan_activation_links
  ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'trial'
    CHECK (link_type IN ('trial', 'purchase')),
  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 7
    CHECK (trial_days IS NULL OR (trial_days >= 1 AND trial_days <= 90));
