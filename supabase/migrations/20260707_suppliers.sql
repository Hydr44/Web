-- Registro fornitori di RescueManager SRL (per le autofatture reverse charge).
-- Anagrafica riusabile. Globale (non org-scoped). Idempotente.
CREATE TABLE IF NOT EXISTS public.suppliers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denominazione       text NOT NULL,
  vat                 text,
  tax_code            text,
  pec                 text,
  codice_destinatario text,
  regime_fiscale      text DEFAULT 'RF01',
  paese               text DEFAULT 'IT',   -- per TD17/TD18 (fornitore estero/UE)
  address             jsonb,
  iban                text,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suppliers_active_idx ON public.suppliers (active, denominazione);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
