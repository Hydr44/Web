-- ============================================================================
-- F0 — Schema per GoCardless + tracking attivazione/abbonamento
-- ============================================================================
-- Parte del workstream "Preventivo → Pagamento → Attivazione" (vedi
-- docs/specs/proposta-gocardless-attivazione.md). Aggiunge il minimo per:
--   - GoCardless come 2° metodo di pagamento accanto a Stripe;
--   - ricorrenza a SCELTA dell'operatore (auto_renew);
--   - tracciare sospensione/disdetta dell'abbonamento.
--
-- SICUREZZA: nessun segreto qui. Il token GoCardless va SOLO nelle env Vercel
-- del website (GOCARDLESS_ACCESS_TOKEN / GOCARDLESS_WEBHOOK_SECRET), mai in DB/codice.
-- Sviluppo/test = SANDBOX.
--
-- IDEMPOTENTE (ADD COLUMN IF NOT EXISTS): sicura da rilanciare.
-- NON ancora applicata: `supabase db push` quando si decide di partire.
-- DB unico per ambiente: queste colonne valgono per org_subscriptions (gestita
-- anche dalle migration desktop) e lead_quotes (gestita dalle migration website).
-- ============================================================================

-- ===== org_subscriptions: metodo pagamento + GoCardless + ricorrenza + stato =====
ALTER TABLE public.org_subscriptions
  -- provider di pagamento usato (complementa billing_type, che è il "tipo" di fatturazione)
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe'
    CHECK (payment_method IN ('stripe','gocardless','manual')),
  -- riferimenti GoCardless (specchiano gli stripe_* esistenti)
  ADD COLUMN IF NOT EXISTS gocardless_customer_id     text,
  ADD COLUMN IF NOT EXISTS gocardless_mandate_id      text,
  ADD COLUMN IF NOT EXISTS gocardless_subscription_id text,
  -- ricorrenza A SCELTA dell'operatore: true = rinnovo automatico, false = solo primo addebito
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true,
  -- tracciamento sospensione / disdetta (oggi assenti)
  ADD COLUMN IF NOT EXISTS suspended_at        timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason   text,
  ADD COLUMN IF NOT EXISTS cancelled_at        timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS last_payment_date   date;

COMMENT ON COLUMN public.org_subscriptions.payment_method IS 'Provider di incasso: stripe | gocardless | manual (bonifico/contanti). Complementa billing_type.';
COMMENT ON COLUMN public.org_subscriptions.auto_renew IS 'true = addebiti ai rinnovi automatici (subscription provider); false = solo primo addebito, rinnovi a mano.';

-- ===== lead_quotes: mandato/pagamento GoCardless sul preventivo (per la pagina di stato) =====
ALTER TABLE public.lead_quotes
  ADD COLUMN IF NOT EXISTS gocardless_mandate_id text,
  ADD COLUMN IF NOT EXISTS gocardless_payment_id text;

-- ============================================================================
-- OPZIONALE (NON abilitato): vincolo CHECK sullo stato abbonamento.
-- Oggi org_subscriptions.status è testo libero e l'app usa più spellings
-- (es. 'canceled' vs 'cancelled'). Prima di abilitarlo:
--   1) SELECT status, count(*) FROM public.org_subscriptions GROUP BY status;
--   2) normalizza i valori fuori lista;
--   3) poi togli il commento al blocco sotto (CHECK NOT VALID = non verifica le
--      righe esistenti, vincola solo le nuove scritture; VALIDATE dopo bonifica).
--
-- ALTER TABLE public.org_subscriptions
--   ADD CONSTRAINT org_subscriptions_status_chk
--   CHECK (status IN ('trial','pending_payment','active','past_due','suspended','canceled','cancelled','expired','inactive'))
--   NOT VALID;
-- ============================================================================
