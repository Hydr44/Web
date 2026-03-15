-- ============================================
-- ERROR CODES TABLE
-- ============================================

-- Tabella codici errore
CREATE TABLE IF NOT EXISTS public.error_codes (
  code TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  solution TEXT NOT NULL,
  related_docs TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Disabled (come per OAuth)
ALTER TABLE public.error_codes DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_error_codes_category ON public.error_codes(category);
CREATE INDEX IF NOT EXISTS idx_error_codes_severity ON public.error_codes(severity);
CREATE INDEX IF NOT EXISTS idx_error_codes_search ON public.error_codes USING GIN(to_tsvector('italian', title || ' ' || COALESCE(description, '')));

-- Popola database con errori principali
INSERT INTO public.error_codes (code, category, severity, title, description, solution, related_docs) VALUES
-- Database Errors
('DB-SYNC-1001', 'database', 'high', 'Errore connessione database', 'Impossibile sincronizzare con il database', 'Verifica la connessione internet. Se il problema persiste, contatta il supporto.', ARRAY['/prodotto/docs/errori#DB-SYNC-1001']),
('DB-SYNC-1002', 'database', 'medium', 'Timeout query database', 'La query al database ha superato il tempo limite', 'Riprova l''operazione. Se il problema persiste, chiudi e riapri l''app.', ARRAY['/prodotto/docs/errori#DB-SYNC-1002']),
('DB-QUERY-1003', 'database', 'high', 'Query database non valida', 'La query inviata al database non è valida', 'Aggiorna l''app all''ultima versione disponibile dalla sezione Impostazioni.', ARRAY['/prodotto/docs/errori#DB-QUERY-1003']),
('DB-PERM-1004', 'database', 'critical', 'Permessi insufficienti', 'Non hai i permessi necessari per questa operazione', 'Contatta l''amministratore della tua organizzazione per ottenere i permessi necessari.', ARRAY['/prodotto/docs/errori#DB-PERM-1004']),

-- OAuth Errors
('OAUTH-AUTH-2001', 'oauth', 'medium', 'Token scaduto', 'Il token di autenticazione è scaduto', 'Effettua di nuovo il login dal menu utente. La sessione scade dopo 1 ora di inattività.', ARRAY['/prodotto/docs/errori#OAUTH-AUTH-2001']),
('OAUTH-AUTH-2002', 'oauth', 'high', 'Token non valido', 'Il token di autenticazione non è valido', 'Esegui logout dal menu utente e rieffettua il login.', ARRAY['/prodotto/docs/errori#OAUTH-AUTH-2002']),
('OAUTH-AUTH-2003', 'oauth', 'high', 'Errore server OAuth', 'Il server di autenticazione è temporaneamente non disponibile', 'Il server di autenticazione è temporaneamente non disponibile. Riprova tra qualche minuto.', ARRAY['/prodotto/docs/errori#OAUTH-AUTH-2003']),
('OAUTH-CALL-2004', 'oauth', 'medium', 'Callback OAuth fallito', 'Il callback di autenticazione non è riuscito', 'Rimuovi la cache del browser (Cache + LocalStorage) e riprova il login.', ARRAY['/prodotto/docs/errori#OAUTH-CALL-2004']),

-- Sync Errors
('SYNC-PULL-3001', 'sync', 'medium', 'Errore download dati', 'Impossibile scaricare i dati dal server', 'Verifica la connessione internet. I dati rimangono salvati localmente.', ARRAY['/prodotto/docs/errori#SYNC-PULL-3001']),
('SYNC-PUSH-3002', 'sync', 'high', 'Errore upload dati', 'Impossibile caricare i dati sul server', 'Riprova l''upload. I dati sono salvati localmente e verranno sincronizzati automaticamente.', ARRAY['/prodotto/docs/errori#SYNC-PUSH-3002']),
('SYNC-CONF-3003', 'sync', 'high', 'Conflitto dati', 'I dati locali entrano in conflitto con quelli del server', 'I dati locali entrano in conflitto con quelli del server. Contatta il supporto per risoluzione manuale.', ARRAY['/prodotto/docs/errori#SYNC-CONF-3003']),
('SYNC-NET-3004', 'sync', 'medium', 'Timeout sincronizzazione', 'La sincronizzazione ha superato il tempo limite', 'La sincronizzazione sta richiedendo troppo tempo. Riprova più tardi o verifica la connessione.', ARRAY['/prodotto/docs/errori#SYNC-NET-3004']),

-- RVFU Errors
('RVFU-AUTH-4001', 'rvfu', 'critical', 'Credenziali RVFU non valide', 'Le credenziali MIT/RVFU non sono valide', 'Verifica le credenziali MIT nella sezione Impostazioni → RVFU. Assicurati che siano attive.', ARRAY['/prodotto/docs/errori#RVFU-AUTH-4001']),
('RVFU-IMPORT-4002', 'rvfu', 'high', 'Errore import dati RVFU', 'Impossibile importare i dati RVFU', 'Controlla il formato dei dati secondo le specifiche MIT. La documentazione è disponibile in Help.', ARRAY['/prodotto/docs/errori#RVFU-IMPORT-4002']),
('RVFU-DOC-4003', 'rvfu', 'high', 'Documento RVFU non valido', 'Il documento RVFU non rispetta il formato richiesto', 'Verifica che il documento rispetti il formato richiesto dal MIT. Consulta la guida in Help.', ARRAY['/prodotto/docs/errori#RVFU-DOC-4003']),
('RVFU-SYNC-4004', 'rvfu', 'high', 'Errore sincronizzazione MIT', 'Impossibile sincronizzare con il server MIT', 'Il server MIT è temporaneamente non disponibile. Riprova tra qualche ora.', ARRAY['/prodotto/docs/errori#RVFU-SYNC-4004']),

-- Fatturazione Errors
('FATT-SDI-5001', 'fatturazione', 'high', 'Errore invio fattura SDI', 'Impossibile inviare la fattura al Sistema di Interscambio', 'Verifica la connessione con SDI e che il codice destinatario sia valido.', ARRAY['/prodotto/docs/errori#FATT-SDI-5001']),
('FATT-XML-5002', 'fatturazione', 'high', 'XML fattura non valido', 'Il formato XML della fattura non è valido', 'Correggi i dati della fattura. Verifica CF, PIVA e altri campi obbligatori.', ARRAY['/prodotto/docs/errori#FATT-XML-5002']),
('FATT-CF-5003', 'fatturazione', 'high', 'Codice fiscale non valido', 'Il codice fiscale del destinatario non è valido', 'Verifica il codice fiscale del destinatario. Deve essere di 16 caratteri per persone fisiche o 11 per persone giuridiche.', ARRAY['/prodotto/docs/errori#FATT-CF-5003']),
('FATT-SIGN-5004', 'fatturazione', 'critical', 'Errore firma digitale', 'Impossibile firmare digitalmente la fattura', 'Riconfigura la firma digitale nella sezione Impostazioni → Fatturazione.', ARRAY['/prodotto/docs/errori#FATT-SIGN-5004'])
ON CONFLICT (code) DO NOTHING;

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_error_codes_updated_at BEFORE UPDATE ON public.error_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

