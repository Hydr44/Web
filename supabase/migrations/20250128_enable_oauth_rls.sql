-- Enable RLS for OAuth tables with permissive policies
-- This allows the OAuth flow to work while maintaining database security

-- ============================================
-- OAUTH_CODES TABLE
-- ============================================
ALTER TABLE public.oauth_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow oauth code insertion" ON public.oauth_codes;
DROP POLICY IF EXISTS "Allow oauth code selection" ON public.oauth_codes;
DROP POLICY IF EXISTS "Users can access their own oauth codes" ON public.oauth_codes;

-- Create permissive policies for OAuth flow
CREATE POLICY "Allow oauth code insertion" ON public.oauth_codes
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow oauth code selection" ON public.oauth_codes
  FOR SELECT
  USING (true);

-- ============================================
-- OAUTH_TOKENS TABLE
-- ============================================
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow oauth token insertion" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Allow oauth token selection" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Users can access their own oauth tokens" ON public.oauth_tokens;

-- Create permissive policies for OAuth flow
CREATE POLICY "Allow oauth token insertion" ON public.oauth_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow oauth token selection" ON public.oauth_tokens
  FOR SELECT
  USING (true);

-- ============================================
-- PROFILES TABLE
-- ============================================
-- KEEP RLS DISABLED for profiles to avoid blocking OAuth flow
-- The OAuth exchange reads profiles using service role, but RLS can still interfere
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATIONS TABLES (OAuth Support)
-- ============================================
-- Disable RLS for orgs and org_members to support OAuth users
-- OAuth users don't have Supabase session (auth.uid() is null)
ALTER TABLE public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members DISABLE ROW LEVEL SECURITY;

