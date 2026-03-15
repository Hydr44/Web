-- Migliorare gestione organizzazioni
-- Aggiungere supporto per utenti senza organizzazione

-- 1. Assicurarsi che la tabella orgs abbia tutti i campi necessari
ALTER TABLE public.orgs 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS vat TEXT,
ADD COLUMN IF NOT EXISTS tax_code TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Aggiornare trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per orgs
DROP TRIGGER IF EXISTS update_orgs_updated_at ON public.orgs;
CREATE TRIGGER update_orgs_updated_at
    BEFORE UPDATE ON public.orgs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Migliorare RLS policies per organizzazioni
-- Policy per permettere agli utenti di creare organizzazioni
DROP POLICY IF EXISTS "orgs_insert_authenticated" ON public.orgs;
CREATE POLICY "orgs_insert_authenticated" ON public.orgs
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Policy per permettere agli utenti di leggere le proprie organizzazioni
DROP POLICY IF EXISTS "orgs_select_members" ON public.orgs;
CREATE POLICY "orgs_select_members" ON public.orgs
  FOR SELECT 
  TO authenticated
  USING (
    id IN (
      SELECT org_id 
      FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per permettere agli owner di aggiornare le proprie organizzazioni
DROP POLICY IF EXISTS "orgs_update_owners" ON public.orgs;
CREATE POLICY "orgs_update_owners" ON public.orgs
  FOR UPDATE 
  TO authenticated
  USING (
    id IN (
      SELECT org_id 
      FROM public.org_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- 4. Migliorare policies per org_members
-- Policy per permettere agli utenti di vedere i membri delle proprie organizzazioni
DROP POLICY IF EXISTS "org_members_select_own_orgs" ON public.org_members;
CREATE POLICY "org_members_select_own_orgs" ON public.org_members
  FOR SELECT 
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id 
      FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per permettere agli owner di aggiungere membri
DROP POLICY IF EXISTS "org_members_insert_owners" ON public.org_members;
CREATE POLICY "org_members_insert_owners" ON public.org_members
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id 
      FROM public.org_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- 5. Funzione per creare organizzazione con utente come owner
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  org_name TEXT,
  org_description TEXT DEFAULT NULL,
  org_address TEXT DEFAULT NULL,
  org_phone TEXT DEFAULT NULL,
  org_email TEXT DEFAULT NULL,
  org_website TEXT DEFAULT NULL,
  org_vat TEXT DEFAULT NULL,
  org_tax_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  current_user_id UUID;
BEGIN
  -- Ottieni l'utente corrente
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Crea l'organizzazione
  INSERT INTO public.orgs (
    name, 
    description, 
    address, 
    phone, 
    email, 
    website, 
    vat, 
    tax_code,
    created_by
  ) VALUES (
    org_name,
    org_description,
    org_address,
    org_phone,
    org_email,
    org_website,
    org_vat,
    org_tax_code,
    current_user_id
  ) RETURNING id INTO new_org_id;
  
  -- Aggiungi l'utente come owner
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (new_org_id, current_user_id, 'owner');
  
  -- Aggiorna il profilo utente
  UPDATE public.profiles 
  SET current_org = new_org_id, updated_at = now()
  WHERE id = current_user_id;
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Funzione per verificare se un utente ha organizzazioni
CREATE OR REPLACE FUNCTION public.user_has_organizations(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.org_members 
    WHERE org_members.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Funzione per ottenere organizzazioni dell'utente
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  org_id UUID,
  org_name TEXT,
  user_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as org_id,
    o.name as org_name,
    om.role as user_role,
    o.created_at
  FROM public.orgs o
  JOIN public.org_members om ON o.id = om.org_id
  WHERE om.user_id = user_id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Commenti per documentazione
COMMENT ON FUNCTION public.create_organization_with_owner IS 'Crea una nuova organizzazione e aggiunge l''utente corrente come owner';
COMMENT ON FUNCTION public.user_has_organizations IS 'Verifica se un utente ha almeno un''organizzazione';
COMMENT ON FUNCTION public.get_user_organizations IS 'Restituisce tutte le organizzazioni di un utente con i relativi ruoli';
