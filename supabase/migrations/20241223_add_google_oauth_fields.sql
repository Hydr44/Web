-- Aggiungere campi per Google OAuth e provider multipli
-- Questa migrazione aggiunge supporto per OAuth providers

-- Aggiungere campi alla tabella profiles per OAuth
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Creare indice per google_id per performance
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON public.profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_profiles_provider_id ON public.profiles(provider_id);

-- Aggiornare constraint per provider
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS check_provider 
CHECK (provider IN ('email', 'google', 'github', 'apple'));

-- Funzione per gestire nuovi utenti OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Trigger per creare/aggiornare profilo automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Aggiornare RLS policies per supportare OAuth
-- Policy per permettere inserimento profili da OAuth
DROP POLICY IF EXISTS "profiles_oauth_insert" ON public.profiles;
CREATE POLICY "profiles_oauth_insert" ON public.profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Policy per permettere aggiornamento profili OAuth
DROP POLICY IF EXISTS "profiles_oauth_update" ON public.profiles;
CREATE POLICY "profiles_oauth_update" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Commenti per documentazione
COMMENT ON COLUMN public.profiles.google_id IS 'Google OAuth user ID';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL avatar utente da provider OAuth';
COMMENT ON COLUMN public.profiles.provider IS 'Provider di autenticazione (email, google, github, apple)';
COMMENT ON COLUMN public.profiles.provider_id IS 'ID utente nel provider OAuth';
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo utente da provider OAuth';
