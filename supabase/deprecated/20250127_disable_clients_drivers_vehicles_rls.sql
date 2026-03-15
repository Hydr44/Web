-- Disable RLS on clients, drivers, and vehicles tables for OAuth users
-- OAuth users don't have Supabase session (auth.uid() is null)
-- This allows OAuth users to access and manage these tables

ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;

