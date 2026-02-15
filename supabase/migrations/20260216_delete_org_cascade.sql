-- Funzione per eliminare un'organizzazione e tutti i dati collegati
-- Esegui PRIMA 20260216_org_cascade_fk.sql per aggiungere ON DELETE CASCADE alle FK org_id.
-- Se non l'hai fatto, la funzione prova comunque un loop di delete da tutte le tabelle con org_id.
CREATE OR REPLACE FUNCTION public.delete_org_cascade(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  iterations int := 0;
  max_iterations int := 25;
BEGIN
  -- Azzera current_org nei profili
  UPDATE public.profiles SET current_org = NULL, updated_at = now() WHERE current_org = p_org_id;

  -- Prova prima il delete diretto (funziona se le FK hanno ON DELETE CASCADE)
  BEGIN
    DELETE FROM public.orgs WHERE id = p_org_id;
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Fallback: loop di delete manuale
  END;

  -- Fallback: delete manuale da tutte le tabelle con org_id
  LOOP
    iterations := iterations + 1;

    FOR r IN (
      SELECT c.table_schema, c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'org_id'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name != 'orgs'
      ORDER BY c.table_name
    ) LOOP
      BEGIN
        EXECUTE format('DELETE FROM %I.%I WHERE org_id = $1', r.table_schema, r.table_name) USING p_org_id;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END LOOP;

    BEGIN
      DELETE FROM public.orgs WHERE id = p_org_id;
      IF FOUND THEN
        RETURN;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    EXIT WHEN iterations >= max_iterations;
  END LOOP;

  RAISE EXCEPTION 'Impossibile eliminare. Esegui 20260216_org_cascade_fk.sql su Supabase e riprova.';
END;
$$;
