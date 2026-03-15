-- Disable RLS on clients table for OAuth users
-- OAuth users don't have Supabase session (auth.uid() is null)
-- This allows OAuth users to create and manage clients

ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

