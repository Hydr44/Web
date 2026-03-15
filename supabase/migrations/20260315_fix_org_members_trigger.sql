-- Fix trigger che causa errore "null value in column user_id of relation org_members"
-- Il problema è che un trigger sta cercando di inserire in org_members quando viene creato un utente,
-- ma fallisce perché user_id è null.

-- Verifica se esiste un trigger problematico e lo rimuove
DO $$
BEGIN
    -- Cerca e rimuovi trigger che inseriscono automaticamente in org_members
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'users' 
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        AND t.tgname LIKE '%org_member%'
    ) THEN
        EXECUTE 'DROP TRIGGER IF EXISTS auto_create_org_member ON auth.users CASCADE';
    END IF;
END $$;

-- Se esiste una funzione che crea automaticamente org_members, la modifichiamo per gestire il caso
-- in cui l'utente non ha ancora un'organizzazione
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea solo il profilo, NON org_members (quello viene creato dal codice applicativo)
  INSERT INTO public.profiles (
    id, 
    email, 
    provider,
    provider_id,
    avatar_url,
    full_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
    COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    provider = EXCLUDED.provider,
    provider_id = EXCLUDED.provider_id,
    avatar_url = EXCLUDED.avatar_url,
    full_name = EXCLUDED.full_name,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assicuriamoci che il trigger sia corretto
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
