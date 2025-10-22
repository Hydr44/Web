-- Set admin flag for founder
-- This migration sets the is_admin flag to true for the founder

-- Update the profiles table to set is_admin = true for haxiesz@gmail.com
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'haxiesz@gmail.com';

-- If the profile doesn't exist, create it
INSERT INTO public.profiles (id, email, is_admin)
SELECT 
  auth.users.id,
  auth.users.email,
  true
FROM auth.users 
WHERE auth.users.email = 'haxiesz@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.users.id
);

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_admin IS 'Admin flag for super admin access - set to true for founder';
