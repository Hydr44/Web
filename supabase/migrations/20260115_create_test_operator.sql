-- Migration: Crea Operatore Admin Iniziale
-- Data: 15 gennaio 2026
-- Crea automaticamente un operatore "admin" per ogni organizzazione se non esiste

-- Hash della password "admin" generato con bcryptjs (cost 10)
-- Password di default: "admin" (da cambiare al primo accesso)
-- Per generare nuovo hash: const bcrypt = require('bcryptjs'); bcrypt.hashSync('password', 10)

DO $$
DECLARE
  org_record RECORD;
  operator_count INTEGER;
  admin_operator_id UUID;
  admin_code TEXT;
BEGIN
  -- Per ogni organizzazione esistente
  FOR org_record IN SELECT id FROM orgs LOOP
    -- Verifica se esiste già un operatore per questa org
    SELECT COUNT(*) INTO operator_count
    FROM operators
    WHERE org_id = org_record.id;
    
    -- Se non esiste nessun operatore, crea l'admin
    IF operator_count = 0 THEN
      -- Genera codice operatore (OP001)
      admin_code := 'OP001';
      
      -- Crea operatore admin
      INSERT INTO operators (
        org_id,
        user_id, -- NULL, può essere associato dopo
        nome,
        cognome,
        email,
        codice_operatore,
        ruolo,
        password_hash,
        attivo,
        permissions
      ) VALUES (
        org_record.id,
        NULL, -- Non associato a nessun utente SSO inizialmente
        'Admin',
        'Sistema',
        NULL,
        admin_code,
        'admin',
        '$2b$10$tFH1w1J9ArMdxFWw4l1MG.5xWNi6hLxvdvGicc3wRoDYCQXrMx46.', -- Hash bcrypt per password "admin"
        true,
        '["*"]'::jsonb -- Tutti i permessi
      )
      RETURNING id INTO admin_operator_id;
      
      RAISE NOTICE 'Operatore admin creato per org %: % (codice: %)', org_record.id, admin_operator_id, admin_code;
      RAISE NOTICE 'Password di default: admin';
      RAISE NOTICE 'IMPORTANTE: Cambiare la password al primo accesso!';
    ELSE
      RAISE NOTICE 'Org % ha già operatori (%), skip creazione admin', org_record.id, operator_count;
    END IF;
  END LOOP;
END $$;

-- Commento finale
COMMENT ON FUNCTION generate_operator_code IS 'Operatore admin iniziale creato automaticamente se non esiste nessun operatore per l''organizzazione. Password default: "admin"';
