-- Migration: Funzionalità Avanzate Fatture
-- Data: 15 gennaio 2026
-- Aggiunge: Note credito/debito, sconti, pagamenti, note interne/esterne

-- ============================================================================
-- 1. NOTE DI CREDITO/DEBITO - Riferimento Fattura Originale
-- ============================================================================

-- Aggiungi campo per riferimento fattura originale (per TD04/TD05)
-- Verifica se la colonna esiste già prima di aggiungerla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'original_invoice_id'
  ) THEN
    ALTER TABLE invoices 
    ADD COLUMN original_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_invoices_original_invoice_id 
  ON invoices(original_invoice_id);

-- Commento
COMMENT ON COLUMN invoices.original_invoice_id IS 
  'Riferimento alla fattura originale per note di credito (TD04) o debito (TD05)';

-- ============================================================================
-- 2. SCONTI E ABBUONI
-- ============================================================================

-- Sconti per riga (in invoice_items)
DO $$ 
BEGIN
  -- discount_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN discount_type TEXT;
    ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_discount_type_check 
      CHECK (discount_type IS NULL OR discount_type IN ('percent', 'amount'));
  END IF;
  
  -- discount_value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN discount_value NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  -- discount_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'discount_description'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN discount_description TEXT;
  END IF;
END $$;

-- Sconto globale documento (in invoices)
DO $$ 
BEGIN
  -- global_discount_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'global_discount_type'
  ) THEN
    ALTER TABLE invoices ADD COLUMN global_discount_type TEXT;
    ALTER TABLE invoices ADD CONSTRAINT invoices_global_discount_type_check 
      CHECK (global_discount_type IS NULL OR global_discount_type IN ('percent', 'amount'));
  END IF;
  
  -- global_discount_value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'global_discount_value'
  ) THEN
    ALTER TABLE invoices ADD COLUMN global_discount_value NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  -- global_discount_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'global_discount_description'
  ) THEN
    ALTER TABLE invoices ADD COLUMN global_discount_description TEXT;
  END IF;
END $$;

-- Commenti
COMMENT ON COLUMN invoice_items.discount_type IS 
  'Tipo sconto riga: percent (percentuale) o amount (importo fisso)';
COMMENT ON COLUMN invoice_items.discount_value IS 
  'Valore sconto riga (percentuale o importo)';
COMMENT ON COLUMN invoices.global_discount_type IS 
  'Tipo sconto globale documento: percent o amount';
COMMENT ON COLUMN invoices.global_discount_value IS 
  'Valore sconto globale documento';

-- ============================================================================
-- 3. NOTE INTERNE VS ESTERNE
-- ============================================================================

-- Separazione note interne (non vanno in SDI) e esterne (vanno in SDI)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'note_internal'
  ) THEN
    ALTER TABLE invoices ADD COLUMN note_internal TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'note_external'
  ) THEN
    ALTER TABLE invoices ADD COLUMN note_external TEXT;
  END IF;
END $$;

-- Commenti
COMMENT ON COLUMN invoices.note_internal IS 
  'Note interne (non visibili al cliente, non vanno in SDI)';
COMMENT ON COLUMN invoices.note_external IS 
  'Note esterne (visibili al cliente, vanno in SDI - max 200 caratteri)';

-- ============================================================================
-- 4. STORICO PAGAMENTI
-- ============================================================================

-- Tabella per storico pagamenti (non va in SDI, solo interno)
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Dati pagamento
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'card', 'other')),
  payment_reference TEXT, -- Numero assegno, riferimento bonifico, ecc.
  
  -- Note
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id 
  ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_org_id 
  ON invoice_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date 
  ON invoice_payments(payment_date);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_invoice_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_payments_updated_at ON invoice_payments;
CREATE TRIGGER invoice_payments_updated_at
  BEFORE UPDATE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payments_updated_at();

-- Campo calcolato per stato pagamento (aggiornato via trigger)
-- Aggiungi campo payment_status in invoices
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
    ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check 
      CHECK (payment_status IN ('unpaid', 'partial', 'paid'));
  END IF;
END $$;

-- Funzione per aggiornare payment_status automaticamente
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC(10,2);
  invoice_total NUMERIC(10,2);
  new_status TEXT;
BEGIN
  -- Calcola totale pagato
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Recupera totale fattura
  SELECT total INTO invoice_total
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Determina nuovo stato
  IF total_paid >= invoice_total THEN
    new_status := 'paid';
  ELSIF total_paid > 0 THEN
    new_status := 'partial';
  ELSE
    new_status := 'unpaid';
  END IF;
  
  -- Aggiorna stato
  UPDATE invoices
  SET payment_status = new_status
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare payment_status quando cambiano i pagamenti
DROP TRIGGER IF EXISTS invoice_payments_update_status ON invoice_payments;
CREATE TRIGGER invoice_payments_update_status
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- Commenti
COMMENT ON TABLE invoice_payments IS 
  'Storico pagamenti fatture (solo interno, non va in SDI)';
COMMENT ON COLUMN invoices.payment_status IS 
  'Stato pagamento: unpaid, partial, paid (calcolato automaticamente)';

-- ============================================================================
-- 5. RLS (Row Level Security)
-- ============================================================================

-- Abilita RLS su invoice_payments
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere pagamenti delle fatture della loro org
-- Verifica se la policy esiste già
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'invoice_payments' 
    AND policyname = 'Users can view invoice_payments of their org'
  ) THEN
    CREATE POLICY "Users can view invoice_payments of their org"
      ON invoice_payments FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM org_members WHERE org_id = invoice_payments.org_id
        )
      );
  END IF;
END $$;

-- Policy: utenti possono inserire pagamenti per fatture della loro org
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'invoice_payments' 
    AND policyname = 'Users can insert invoice_payments of their org'
  ) THEN
    CREATE POLICY "Users can insert invoice_payments of their org"
      ON invoice_payments FOR INSERT
      WITH CHECK (
        auth.uid() IN (
          SELECT user_id FROM org_members WHERE org_id = invoice_payments.org_id
        )
      );
  END IF;
END $$;

-- Policy: utenti possono aggiornare pagamenti delle fatture della loro org
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'invoice_payments' 
    AND policyname = 'Users can update invoice_payments of their org'
  ) THEN
    CREATE POLICY "Users can update invoice_payments of their org"
      ON invoice_payments FOR UPDATE
      USING (
        auth.uid() IN (
          SELECT user_id FROM org_members WHERE org_id = invoice_payments.org_id
        )
      );
  END IF;
END $$;

-- Policy: utenti possono eliminare pagamenti delle fatture della loro org
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'invoice_payments' 
    AND policyname = 'Users can delete invoice_payments of their org'
  ) THEN
    CREATE POLICY "Users can delete invoice_payments of their org"
      ON invoice_payments FOR DELETE
      USING (
        auth.uid() IN (
          SELECT user_id FROM org_members WHERE org_id = invoice_payments.org_id
        )
      );
  END IF;
END $$;
