-- Catalogo preset di fatturazione (piani/pacchetti/una-tantum) di RescueManager SRL.
-- Voci riusabili nelle fatture ai clienti. Globale (non org-scoped). Idempotente.
CREATE TABLE IF NOT EXISTS public.billing_presets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  description    text,
  kind           text NOT NULL DEFAULT 'una_tantum'
                   CHECK (kind IN ('abbonamento','pacchetto','una_tantum')),
  unit_price     numeric NOT NULL DEFAULT 0,
  vat_perc       numeric NOT NULL DEFAULT 22,
  billing_period text,          -- 'mensile' | 'annuale' | 'biennale' | NULL
  item_code      text,          -- codice articolo opzionale
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS billing_presets_active_idx ON public.billing_presets (active, kind);
ALTER TABLE public.billing_presets ENABLE ROW LEVEL SECURITY;
-- Nessuna policy: accessibile solo dal service_role (route admin).
