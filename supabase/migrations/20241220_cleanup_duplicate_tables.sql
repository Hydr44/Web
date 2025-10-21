-- Cleanup duplicate tables and fix authentication issues
-- This migration will clean up the duplicate tables causing login issues

-- 1. First, let's check what data exists in the duplicate tables
-- (This is just for reference, we'll handle the data migration separately)

-- 2. Drop duplicate tables that are causing conflicts
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.orgs CASCADE;

-- 3. Ensure we only use the main tables:
-- - public.organizations (main org table)
-- - public.memberships (main membership table)
-- - public.profiles (main user profiles with is_admin)

-- 4. Fix foreign key references to use consistent table names
-- Update spare_parts to reference organizations instead of orgs
ALTER TABLE public.spare_parts 
DROP CONSTRAINT IF EXISTS spare_parts_org_id_fkey;

ALTER TABLE public.spare_parts 
ADD CONSTRAINT spare_parts_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.organizations(id);

-- Update vehicles_catalog to reference organizations instead of orgs  
ALTER TABLE public.vehicles_catalog 
DROP CONSTRAINT IF EXISTS vehicles_catalog_org_id_fkey;

ALTER TABLE public.vehicles_catalog 
ADD CONSTRAINT vehicles_catalog_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.organizations(id);

-- Update yard_items to reference organizations instead of orgs
ALTER TABLE public.yard_items 
DROP CONSTRAINT IF EXISTS yard_items_org_id_fkey;

ALTER TABLE public.yard_items 
ADD CONSTRAINT yard_items_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.organizations(id);

-- 5. Ensure profiles table has proper admin field
-- (This should already exist from previous migration)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 6. Create index for better performance on admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- 7. Add comment for clarity
COMMENT ON TABLE public.organizations IS 'Main organizations table - use this for all org references';
COMMENT ON TABLE public.memberships IS 'Main memberships table - use this for all user-org relationships';
COMMENT ON TABLE public.profiles IS 'Main user profiles table with admin flag';
