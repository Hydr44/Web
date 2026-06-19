-- =============================================================================
-- Allarga leads_status_check agli stati del modello C.
-- BUG: il vincolo ammetteva solo ['new','contacted','demo_active','quote_sent',
-- 'converted','lost'] → ogni update a 'in_verifica' (pagamento webhook, visura/submit,
-- bottone admin "Invia in verifica") VIOLAVA il CHECK:
--   - admin → 500
--   - webhook / visura/submit → fallimento silenzioso → il lead restava 'quote_sent'
--     → NON appariva in Revisione.
-- Aggiunge: trattativa, in_verifica, attivato (mantiene converted come alias legacy).
-- =============================================================================
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check
  CHECK (status = ANY (ARRAY[
    'new'::text,
    'contacted'::text,
    'demo_active'::text,
    'quote_sent'::text,
    'trattativa'::text,
    'in_verifica'::text,
    'attivato'::text,
    'converted'::text,   -- alias legacy di 'attivato'
    'lost'::text
  ]));
