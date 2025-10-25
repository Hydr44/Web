-- Create staff users in Supabase Auth and Profiles
-- This migration creates the default staff users

-- Insert staff users into auth.users (this will be done via API)
-- For now, we'll just ensure the profiles table has the right structure

-- Ensure profiles table has staff columns
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_staff') THEN
        ALTER TABLE public.profiles ADD COLUMN is_staff boolean DEFAULT false;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'staff_role') THEN
        ALTER TABLE public.profiles ADD COLUMN staff_role text CHECK (staff_role = ANY (ARRAY['admin'::text, 'marketing'::text, 'support'::text, 'staff'::text]));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
    END IF;
END $$;

-- Create RLS policies for staff access to leads
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Staff can update leads" ON public.leads;
DROP POLICY IF EXISTS "Staff can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Staff can delete leads" ON public.leads;

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

CREATE POLICY "Staff can delete leads" ON public.leads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_staff = true
        )
    );

-- Create RLS policies for staff access to profiles (staff only)
DROP POLICY IF EXISTS "Staff can view staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update staff profiles" ON public.profiles;

CREATE POLICY "Staff can view staff profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.is_staff = true
        )
    );

CREATE POLICY "Staff can update staff profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.is_staff = true
        )
    );

-- Enable RLS on leads table if not already enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
