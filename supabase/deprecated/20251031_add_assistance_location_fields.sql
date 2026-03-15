-- Estensione tabella assistance_requests con campi per geolocalizzazione e stato

ALTER TABLE public.assistance_requests
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS accuracy double precision,
  ADD COLUMN IF NOT EXISTS received_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Indici utili per ricerche rapide
CREATE INDEX IF NOT EXISTS assistance_requests_token_idx
  ON public.assistance_requests (token);

CREATE INDEX IF NOT EXISTS assistance_requests_status_idx
  ON public.assistance_requests (status);

CREATE INDEX IF NOT EXISTS assistance_requests_org_status_idx
  ON public.assistance_requests (org_id, status);

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION public.set_assistance_requests_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assistance_requests_set_updated_at
  ON public.assistance_requests;

CREATE TRIGGER assistance_requests_set_updated_at
  BEFORE UPDATE ON public.assistance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assistance_requests_updated_at();

