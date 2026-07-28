-- Ledger dei pagamenti abbonamento registrati manualmente dallo staff dal
-- pannello admin (Clienti → dettaglio → "Rinnova / avvenuto pagamento").
--
-- NON esiste oggi una tabella per i pagamenti dell'abbonamento SaaS che l'org
-- versa a RescueManager: `invoices`/`invoice_payments` sono tenant-scoped (l'org
-- fattura i PROPRI clienti). Questa tabella è il registro lato piattaforma.
--
-- Idempotente. Applicare PRIMA su staging, poi (a verifica fatta) su prod.
-- Finché non è applicata, il rinnovo funziona comunque: la route inserisce
-- qui in best-effort e ignora l'errore "relation does not exist".

CREATE TABLE IF NOT EXISTS public.org_subscription_payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  amount       numeric,                          -- importo pagato (opzionale)
  currency     text NOT NULL DEFAULT 'EUR',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  renew_interval text,                            -- monthly|yearly|biennial (durata rinnovo)
  period_end   timestamptz,                      -- nuova scadenza impostata dal rinnovo
  method       text NOT NULL DEFAULT 'manual',   -- manual/bonifico (informativo)
  note         text,
  recorded_by  text,                             -- email dello staff che ha confermato
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_sub_payments_org
  ON public.org_subscription_payments (org_id);
CREATE INDEX IF NOT EXISTS idx_org_sub_payments_date
  ON public.org_subscription_payments (payment_date DESC);

-- FK verso orgs solo se la tabella esiste (evita fallimenti su ambienti parziali).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orgs'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'org_subscription_payments_org_id_fkey'
  ) THEN
    ALTER TABLE public.org_subscription_payments
      ADD CONSTRAINT org_subscription_payments_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.orgs (id) ON DELETE CASCADE;
  END IF;
END $$;

-- RLS on senza policy: tabella di sola piattaforma, accessibile esclusivamente
-- via service_role (supabaseAdmin, che bypassa la RLS). Nessun tenant deve
-- poterla leggere.
ALTER TABLE public.org_subscription_payments ENABLE ROW LEVEL SECURITY;
