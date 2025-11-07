-- Disable RLS on transports table for OAuth users
-- OAuth users don't have Supabase session (auth.uid() is null)
-- This allows OAuth users to create and manage transports

ALTER TABLE public.transports DISABLE ROW LEVEL SECURITY;

