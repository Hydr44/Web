-- Migration: Sistema Operatori Completo
-- Data: 15 gennaio 2026
-- Crea: operators, operator_sessions, operator_activity_log

-- ============================================================================
-- 1. TABELLA OPERATORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Identificazione
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  codice_operatore TEXT, -- Codice univoco (es. "OP001")
  
  -- Ruolo e permessi
  ruolo TEXT DEFAULT 'operatore' CHECK (ruolo IN ('operatore', 'supervisore', 'admin')),
  permissions JSONB DEFAULT '[]'::jsonb, -- Permessi granulari
  
  -- Autenticazione
  password_hash TEXT NOT NULL, -- bcrypt
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  
  -- Stato
  attivo BOOLEAN DEFAULT true,
  ultimo_accesso TIMESTAMPTZ,
  ultimo_cambio_password TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_operators_org_id ON operators(org_id);
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON operators(user_id);
CREATE INDEX IF NOT EXISTS idx_operators_codice ON operators(codice_operatore) WHERE codice_operatore IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operators_attivo ON operators(attivo) WHERE attivo = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_operators_org_codice ON operators(org_id, codice_operatore) WHERE codice_operatore IS NOT NULL;

-- Commenti
COMMENT ON TABLE operators IS 'Operatori dell''organizzazione con autenticazione separata da SSO';
COMMENT ON COLUMN operators.user_id IS 'Utente SSO associato (opzionale, un utente può avere più operatori)';
COMMENT ON COLUMN operators.codice_operatore IS 'Codice univoco per organizzazione (es. OP001)';
COMMENT ON COLUMN operators.permissions IS 'Array JSON di permessi granulari (es. ["transports.create", "invoices.view"])';

-- ============================================================================
-- 2. TABELLA OPERATOR_SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS operator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES operators(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Utente SSO
  
  -- Token (hash, non JWT raw)
  access_token_hash TEXT NOT NULL,
  refresh_token_hash TEXT,
  
  -- Dispositivo
  device_id TEXT NOT NULL, -- Fingerprint dispositivo
  device_name TEXT, -- Nome dispositivo (opzionale)
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  user_agent TEXT,
  ip_address TEXT,
  
  -- Scadenze
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ,
  is_persistent BOOLEAN DEFAULT false, -- Token persistente (non scade)
  
  -- Stato
  attivo BOOLEAN DEFAULT true,
  ultimo_uso TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ, -- Se revocato manualmente
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_operator_sessions_operator_id ON operator_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_sessions_device_id ON operator_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_operator_sessions_active ON operator_sessions(attivo, expires_at) WHERE attivo = true;
CREATE INDEX IF NOT EXISTS idx_operator_sessions_org_id ON operator_sessions(org_id);

-- Commenti
COMMENT ON TABLE operator_sessions IS 'Sessioni attive degli operatori con token JWT';
COMMENT ON COLUMN operator_sessions.access_token_hash IS 'Hash SHA256 del JWT access token (non salvare JWT raw)';
COMMENT ON COLUMN operator_sessions.is_persistent IS 'Se true, token non scade (persistente per dispositivo)';

-- ============================================================================
-- 3. TABELLA OPERATOR_ACTIVITY_LOG (Audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS operator_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES operator_sessions(id) ON DELETE SET NULL,
  
  -- Azione
  action_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'view'
  resource_type TEXT, -- 'transport', 'client', 'invoice', ecc.
  resource_id UUID,
  
  -- Dettagli
  description TEXT,
  metadata JSONB, -- Dati aggiuntivi
  
  -- Contesto
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_operator_activity_operator_id ON operator_activity_log(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_activity_org_id ON operator_activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_operator_activity_created_at ON operator_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_activity_action_type ON operator_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_operator_activity_resource ON operator_activity_log(resource_type, resource_id) WHERE resource_type IS NOT NULL;

-- Commenti
COMMENT ON TABLE operator_activity_log IS 'Log di tutte le azioni degli operatori per audit e tracciabilità';
COMMENT ON COLUMN operator_activity_log.metadata IS 'Dati aggiuntivi in formato JSON (es. valori modificati, dettagli operazione)';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Trigger per updated_at su operators
CREATE OR REPLACE FUNCTION update_operators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_operators_updated_at ON operators;
CREATE TRIGGER trigger_update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_operators_updated_at();

-- Trigger per updated_at su operator_sessions
CREATE OR REPLACE FUNCTION update_operator_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_operator_sessions_updated_at ON operator_sessions;
CREATE TRIGGER trigger_update_operator_sessions_updated_at
  BEFORE UPDATE ON operator_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_operator_sessions_updated_at();

-- Trigger per aggiornare ultimo_uso su operator_sessions
CREATE OR REPLACE FUNCTION update_operator_sessions_last_use()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultimo_uso = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_operator_sessions_last_use ON operator_sessions;
CREATE TRIGGER trigger_update_operator_sessions_last_use
  BEFORE UPDATE ON operator_sessions
  FOR EACH ROW
  WHEN (OLD.attivo = true AND NEW.attivo = true)
  EXECUTE FUNCTION update_operator_sessions_last_use();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Abilita RLS
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies per operators
-- Gli operatori possono vedere solo quelli della loro org
CREATE POLICY "Operators can view operators in their org" ON operators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = operators.org_id
      AND om.user_id = auth.uid()
    )
  );

-- Solo admin org possono creare/modificare operatori
CREATE POLICY "Org admins can manage operators" ON operators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = operators.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = operators.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Policies per operator_sessions
-- Gli operatori possono vedere solo le loro sessioni
CREATE POLICY "Operators can view their own sessions" ON operator_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators o
      WHERE o.id = operator_sessions.operator_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.org_id = o.org_id
        AND om.user_id = auth.uid()
      )
    )
  );

-- Policies per operator_activity_log
-- Gli operatori possono vedere solo i log della loro org
CREATE POLICY "Operators can view activity logs in their org" ON operator_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = operator_activity_log.org_id
      AND om.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. FUNZIONI HELPER
-- ============================================================================

-- Funzione per generare codice operatore univoco
CREATE OR REPLACE FUNCTION generate_operator_code(org_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_code TEXT;
BEGIN
  -- Trova il prossimo numero disponibile
  SELECT COALESCE(MAX(CAST(SUBSTRING(codice_operatore FROM 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM operators
  WHERE org_id = org_uuid
  AND codice_operatore ~ '^OP[0-9]+$';
  
  -- Genera codice (OP001, OP002, ecc.)
  new_code := 'OP' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Funzione per invalidare tutte le sessioni di un operatore
CREATE OR REPLACE FUNCTION revoke_operator_sessions(op_id UUID)
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE operator_sessions
  SET attivo = false, revoked_at = NOW()
  WHERE operator_id = op_id
  AND attivo = true;
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- Funzione per pulire sessioni scadute (da chiamare periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE operator_sessions
  SET attivo = false
  WHERE attivo = true
  AND expires_at < NOW()
  AND is_persistent = false;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Commenti funzioni
COMMENT ON FUNCTION generate_operator_code IS 'Genera codice operatore univoco per organizzazione (OP001, OP002, ecc.)';
COMMENT ON FUNCTION revoke_operator_sessions IS 'Revoca tutte le sessioni attive di un operatore';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Pulisce sessioni scadute (chiamare periodicamente con cron)';
