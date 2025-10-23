-- Fix user organization setup
-- Create default organization and add user as member

-- 1. Create default organization if it doesn't exist
INSERT INTO public.orgs (id, name, created_at, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'RescueManager Default',
  now(),
  '7ac7c007-0156-481d-9db1-bd9a098fb76b'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Add user as owner of default organization
INSERT INTO public.org_members (org_id, user_id, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '7ac7c007-0156-481d-9db1-bd9a098fb76b',
  'owner',
  now()
)
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 3. Update user profile with current_org
INSERT INTO public.profiles (id, email, current_org, created_at, updated_at)
VALUES (
  '7ac7c007-0156-481d-9db1-bd9a098fb76b',
  'haxiesz@gmail.com',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  current_org = '00000000-0000-0000-0000-000000000001',
  updated_at = now();

-- 4. Add permissive policies for vehicles and drivers
CREATE POLICY IF NOT EXISTS "vehicles_select_all" ON public.vehicles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "drivers_select_all" ON public.drivers  
FOR SELECT TO authenticated
USING (true);

-- 5. Add INSERT policies for vehicles and drivers
CREATE POLICY IF NOT EXISTS "vehicles_insert_all" ON public.vehicles
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "drivers_insert_all" ON public.drivers
FOR INSERT TO authenticated  
WITH CHECK (true);
