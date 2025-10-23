-- Fix infinite recursion in RLS policies
-- Il problema è che le policies si riferiscono a se stesse creando un loop

-- 1. Rimuovi tutte le policies problematiche per org_members
DROP POLICY IF EXISTS "org_members_select_own_orgs" ON public.org_members;
DROP POLICY IF EXISTS "org_members_insert_owners" ON public.org_members;
DROP POLICY IF EXISTS "org_members_update_owners" ON public.org_members;
DROP POLICY IF EXISTS "org_members_delete_owners" ON public.org_members;

-- 2. Crea policies semplici e sicure per org_members
-- Policy per SELECT: gli utenti possono vedere solo i membri delle loro organizzazioni
CREATE POLICY "org_members_select_simple" ON public.org_members
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om2 
      WHERE om2.org_id = org_members.org_id 
      AND om2.user_id = auth.uid()
    )
  );

-- Policy per INSERT: solo gli owner possono aggiungere membri
CREATE POLICY "org_members_insert_simple" ON public.org_members
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om 
      WHERE om.org_id = org_members.org_id 
      AND om.user_id = auth.uid() 
      AND om.role = 'owner'
    )
  );

-- Policy per UPDATE: solo gli owner possono modificare i membri
CREATE POLICY "org_members_update_simple" ON public.org_members
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om 
      WHERE om.org_id = org_members.org_id 
      AND om.user_id = auth.uid() 
      AND om.role = 'owner'
    )
  );

-- Policy per DELETE: solo gli owner possono rimuovere membri
CREATE POLICY "org_members_delete_simple" ON public.org_members
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om 
      WHERE om.org_id = org_members.org_id 
      AND om.user_id = auth.uid() 
      AND om.role = 'owner'
    )
  );

-- 3. Assicurati che RLS sia abilitato
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 4. Crea policy per permettere agli utenti di vedere le proprie memberships
CREATE POLICY "org_members_own_memberships" ON public.org_members
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Fix policies per orgs table
DROP POLICY IF EXISTS "orgs_select_members" ON public.orgs;
DROP POLICY IF EXISTS "orgs_update_owners" ON public.orgs;

-- Policy semplice per orgs
CREATE POLICY "orgs_select_simple" ON public.orgs
  FOR SELECT 
  TO authenticated
  USING (
    id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "orgs_insert_simple" ON public.orgs
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "orgs_update_simple" ON public.orgs
  FOR UPDATE 
  TO authenticated
  USING (
    id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- 6. Assicurati che RLS sia abilitato per orgs
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
