-- Creazione tabelle OAuth per desktop app
-- Questa migrazione crea le tabelle necessarie per il flusso OAuth

-- Tabella per i codici OAuth temporanei
CREATE TABLE IF NOT EXISTS public.oauth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL DEFAULT 'desktop_app',
  redirect_uri TEXT NOT NULL,
  state TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per i token OAuth
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL DEFAULT 'desktop_app',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT DEFAULT 'read write',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_oauth_codes_code ON public.oauth_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_user_id ON public.oauth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires_at ON public.oauth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_used ON public.oauth_codes(used);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access_token ON public.oauth_tokens(access_token);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh_token ON public.oauth_tokens(refresh_token);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON public.oauth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_is_active ON public.oauth_tokens(is_active);

-- RLS (Row Level Security) policies
ALTER TABLE public.oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Policy per oauth_codes: permette inserimento per OAuth flow, lettura solo per utente proprietario
CREATE POLICY "Allow oauth code insertion" ON public.oauth_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can access their own oauth codes" ON public.oauth_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy per oauth_tokens: permette inserimento per OAuth flow, lettura solo per utente proprietario
CREATE POLICY "Allow oauth token insertion" ON public.oauth_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can access their own oauth tokens" ON public.oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Funzione per pulizia automatica dei codici scaduti
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per pulizia automatica dei token scaduti
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_tokens 
  WHERE expires_at < NOW() OR is_active = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_oauth_codes_updated_at
  BEFORE UPDATE ON public.oauth_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON public.oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
