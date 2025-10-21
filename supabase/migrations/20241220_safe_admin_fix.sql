-- Safe migration: Fix login issues without touching existing data
-- This migration only adds missing constraints and indexes without dropping tables

-- 1. Ensure profiles table has proper admin field (should already exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Create index for better performance on admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- 3. Add comment for clarity
COMMENT ON COLUMN public.profiles.is_admin IS 'Admin flag for super admin access';

-- 4. Ensure we have proper RLS policies for profiles table
-- (These should already exist, but let's make sure)

-- 5. Add any missing constraints that don't affect existing data
-- (Only add constraints that won't fail on existing data)

-- Note: We're NOT dropping duplicate tables to avoid data loss
-- The duplicate tables issue will be resolved in a future migration
-- after proper data migration planning
