-- Safe staff system migration
-- This migration works with your existing database structure

-- Add staff role to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS staff_role text DEFAULT NULL 
CHECK (staff_role IN ('admin', 'marketing', 'support', 'staff'));

-- Add staff status to profiles table  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_staff boolean DEFAULT false;

-- Create index for staff queries
CREATE INDEX IF NOT EXISTS idx_profiles_staff_role ON public.profiles(staff_role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_staff ON public.profiles(is_staff);

-- Update existing admin users to be staff
UPDATE public.profiles 
SET is_staff = true, staff_role = 'admin' 
WHERE is_admin = true;

-- Create RLS policies for staff access (drop existing ones first)
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Staff can update leads" ON public.leads;
DROP POLICY IF EXISTS "Staff can insert leads" ON public.leads;

CREATE POLICY "Staff can view leads" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Staff can update leads" ON public.leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Staff can insert leads" ON public.leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

-- Create function to get staff user info
CREATE OR REPLACE FUNCTION get_staff_user_info(user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  staff_role text,
  is_staff boolean,
  is_admin boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.staff_role,
    p.is_staff,
    p.is_admin
  FROM public.profiles p
  WHERE p.id = user_id 
  AND p.is_staff = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to authenticate staff
CREATE OR REPLACE FUNCTION authenticate_staff(email_param text, password_hash text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  staff_role text,
  is_staff boolean,
  is_admin boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.staff_role,
    p.is_staff,
    p.is_admin
  FROM public.profiles p
  WHERE p.email = email_param 
  AND p.is_staff = true
  AND p.id IN (
    SELECT id FROM auth.users 
    WHERE email = email_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
