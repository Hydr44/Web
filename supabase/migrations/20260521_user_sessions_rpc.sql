-- Le API PostgREST/REST di Supabase espongono solo gli schema `public` e
-- `graphql_public`. Quindi `auth.sessions` NON è leggibile via
-- `.schema('auth').from('sessions')` (errore "schema must be one of public,
-- graphql_public").
--
-- Soluzione: 3 funzioni SECURITY DEFINER in `public` che proxy auth.sessions
-- limitando ai record dell'utente in sessione (auth.uid()).

------------------------------------------------------------------------------
-- list_my_sessions() — lista delle sessioni attive dell'utente in sessione
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_my_sessions()
RETURNS TABLE (
  id            uuid,
  created_at    timestamptz,
  updated_at    timestamptz,
  not_after     timestamptz,
  ip            inet,
  user_agent    text,
  aal           text,
  factor_id     uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    s.id,
    s.created_at,
    s.updated_at,
    s.not_after,
    s.ip,
    s.user_agent,
    s.aal::text,
    s.factor_id
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.updated_at DESC NULLS LAST
  LIMIT 100;
$$;

------------------------------------------------------------------------------
-- revoke_my_session(uuid) — revoca una specifica sessione dell'utente
-- Ritorna true se eliminata, false se non trovata. Solleva 'forbidden' se
-- la sessione appartiene a un altro utente.
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_my_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM auth.sessions WHERE id = p_session_id;
  IF v_owner IS NULL THEN
    RETURN false;
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  DELETE FROM auth.sessions WHERE id = p_session_id;
  RETURN true;
END$$;

------------------------------------------------------------------------------
-- revoke_my_other_sessions() — revoca tutte le sessioni dell'utente
-- TRANNE quella corrente (letta dal claim 'session_id' del JWT, se presente).
-- Ritorna il numero di sessioni eliminate.
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_my_other_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_current uuid;
  v_count   integer;
BEGIN
  BEGIN
    v_current := NULLIF(
      current_setting('request.jwt.claims', true)::jsonb->>'session_id',
      ''
    )::uuid;
  EXCEPTION WHEN others THEN
    v_current := NULL;
  END;

  DELETE FROM auth.sessions
  WHERE user_id = auth.uid()
    AND (v_current IS NULL OR id <> v_current);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END$$;

-- Permessi: solo utenti autenticati. anon / service_role esclusi.
REVOKE ALL ON FUNCTION public.list_my_sessions()          FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_my_session(uuid)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_my_other_sessions()  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_my_sessions()          TO authenticated;
GRANT  EXECUTE ON FUNCTION public.revoke_my_session(uuid)     TO authenticated;
GRANT  EXECUTE ON FUNCTION public.revoke_my_other_sessions()  TO authenticated;

COMMENT ON FUNCTION public.list_my_sessions() IS
  'Lista le sessioni attive dell''utente in sessione (proxy SECURITY DEFINER per auth.sessions, RLS-equivalent via auth.uid()).';
COMMENT ON FUNCTION public.revoke_my_session(uuid) IS
  'Revoca una sessione specifica dell''utente in sessione. Solleva forbidden (42501) se la sessione è di un altro utente.';
COMMENT ON FUNCTION public.revoke_my_other_sessions() IS
  'Revoca tutte le sessioni dell''utente eccetto quella corrente (claim session_id dal JWT).';
