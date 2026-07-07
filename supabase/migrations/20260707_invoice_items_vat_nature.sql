-- Natura IVA per riga fattura (FatturaPA §2.2.2.2 Natura).
-- Obbligatoria per le righe con aliquota 0 (esenti, non imponibili, reverse charge).
-- Usata dalle autofatture (TD16/TD17/TD18) e dalle fatture con natura N1..N7.
-- Applicata su prod (ienzdgrqalltvkdkuamp) e staging (rqwdimgwtewrsintvwoe) il 2026-07-07.
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS vat_nature text;
