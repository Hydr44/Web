-- Fix admin panel issues and ensure all required fields exist
-- This migration addresses null field issues and missing constraints

-- Ensure profiles table has all required fields with proper defaults
DO $$ BEGIN
  -- Add missing fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_staff') THEN
    ALTER TABLE public.profiles ADD COLUMN is_staff boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'staff_role') THEN
    ALTER TABLE public.profiles ADD COLUMN staff_role text CHECK (staff_role = ANY (ARRAY['admin'::text, 'marketing'::text, 'support'::text, 'staff'::text]));
  END IF;
END $$;

-- Update existing profiles to have default values for null fields
UPDATE public.profiles 
SET 
  full_name = COALESCE(full_name, ''),
  avatar_url = COALESCE(avatar_url, ''),
  is_admin = COALESCE(is_admin, false),
  is_staff = COALESCE(is_staff, false),
  staff_role = COALESCE(staff_role, 'staff')
WHERE 
  full_name IS NULL OR 
  avatar_url IS NULL OR 
  is_admin IS NULL OR 
  is_staff IS NULL OR 
  staff_role IS NULL;

-- Ensure orgs table has all required fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'phone') THEN
    ALTER TABLE public.orgs ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'email') THEN
    ALTER TABLE public.orgs ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'address') THEN
    ALTER TABLE public.orgs ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'website') THEN
    ALTER TABLE public.orgs ADD COLUMN website text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'vat') THEN
    ALTER TABLE public.orgs ADD COLUMN vat text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'tax_code') THEN
    ALTER TABLE public.orgs ADD COLUMN tax_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'description') THEN
    ALTER TABLE public.orgs ADD COLUMN description text;
  END IF;
END $$;

-- Update existing orgs to have default values for null fields
UPDATE public.orgs 
SET 
  phone = COALESCE(phone, ''),
  email = COALESCE(email, ''),
  address = COALESCE(address, ''),
  website = COALESCE(website, ''),
  vat = COALESCE(vat, ''),
  tax_code = COALESCE(tax_code, ''),
  description = COALESCE(description, '')
WHERE 
  phone IS NULL OR 
  email IS NULL OR 
  address IS NULL OR 
  website IS NULL OR 
  vat IS NULL OR 
  tax_code IS NULL OR 
  description IS NULL;

-- Create indexes for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_staff ON public.profiles(is_staff);
CREATE INDEX IF NOT EXISTS idx_profiles_staff_role ON public.profiles(staff_role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_orgs_created_at ON public.orgs(created_at);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members(user_id);

-- Ensure RLS policies are properly set up for admin access
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.is_staff = true
    )
  );

DROP POLICY IF EXISTS "Staff can view all orgs" ON public.orgs;
CREATE POLICY "Staff can view all orgs" ON public.orgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.is_staff = true
    )
  );

DROP POLICY IF EXISTS "Staff can view all org_members" ON public.org_members;
CREATE POLICY "Staff can view all org_members" ON public.org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.is_staff = true
    )
  );

-- Add function to get organization member count
CREATE OR REPLACE FUNCTION get_org_member_count(org_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM public.org_members 
    WHERE org_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get organization admin name
CREATE OR REPLACE FUNCTION get_org_admin_name(org_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT p.full_name 
    FROM public.org_members om
    JOIN public.profiles p ON p.id = om.user_id
    WHERE om.org_id = $1 AND om.role = 'owner'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
