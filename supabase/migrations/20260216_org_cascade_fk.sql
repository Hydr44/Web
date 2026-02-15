-- Fix: aggiunge ON DELETE CASCADE alle FK org_id che referenziano orgs
-- Così DELETE FROM orgs fa cascade automatico su quotes, invoices, org_members, ecc.
-- Esegui questo script su Supabase SQL Editor (prima della funzione delete_org_cascade)

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT 
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS ref_table,
      ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.column_name = 'org_id'
      AND ccu.table_name = 'orgs'
      AND ccu.column_name = 'id'
  ) LOOP
    BEGIN
      -- Ricrea la FK con ON DELETE CASCADE
      EXECUTE format(
        'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
        r.table_schema, r.table_name, r.constraint_name
      );
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.orgs(id) ON DELETE CASCADE',
        r.table_schema, r.table_name, r.constraint_name, r.column_name
      );
      RAISE NOTICE 'Updated % on %.%', r.constraint_name, r.table_schema, r.table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not update %: %', r.constraint_name, SQLERRM;
    END;
  END LOOP;
END $$;
