-- Simplified admin setup for founder
-- This is a simpler version that should work better

-- First, let's make sure the is_admin column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Now set the founder as admin
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'haxiesz@gmail.com';

-- If no profile exists for the founder, we need to create it manually
-- You'll need to run this after logging in at least once
-- INSERT INTO public.profiles (id, email, is_admin)
-- VALUES ('your-user-id-here', 'haxiesz@gmail.com', true);

-- Let's also check what profiles exist
SELECT id, email, is_admin FROM public.profiles WHERE email = 'haxiesz@gmail.com';
