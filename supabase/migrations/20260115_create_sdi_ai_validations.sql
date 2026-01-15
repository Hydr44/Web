-- Tabella per salvare validazioni IA fatture SDI
CREATE TABLE IF NOT EXISTS sdi_ai_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL,
  stato_validazione TEXT NOT NULL CHECK (stato_validazione IN ('ok', 'warning', 'error')),
  alert_ia JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt_inviato TEXT,
  risposta_ia TEXT,
  analisi_ia JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_sdi_ai_validations_org_id ON sdi_ai_validations(org_id);
CREATE INDEX IF NOT EXISTS idx_sdi_ai_validations_invoice_id ON sdi_ai_validations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sdi_ai_validations_stato ON sdi_ai_validations(stato_validazione);

-- RLS (Row Level Security)
ALTER TABLE sdi_ai_validations ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo validazioni della propria organizzazione
CREATE POLICY "Users can view their org validations"
  ON sdi_ai_validations
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: service role può fare tutto
CREATE POLICY "Service role can do everything"
  ON sdi_ai_validations
  FOR ALL
  USING (true)
  WITH CHECK (true);
