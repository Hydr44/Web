-- CRM commerciale a provvigione — anticipo campo importo (solo display in testata).
-- Additivo e idempotente: colonne nuove su `staff`, default NULL/false.
-- NON tocca nessuna riga esistente né altre tabelle (lead/clienti). Vedi
-- docs/specs/crm-commerciale-provvigione.md §3.3 e §15.2.
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2),   -- € fissi per cliente attivato
  ADD COLUMN IF NOT EXISTS payout_iban       text,
  ADD COLUMN IF NOT EXISTS is_external       boolean NOT NULL DEFAULT false;  -- agente esterno a P.IVA

COMMENT ON COLUMN staff.commission_amount IS 'Provvigione fissa € per cliente attivato (snapshot nel commission_ledger all''accrual — Fase 3)';
