-- Simple staff_users table creation
-- This migration creates the staff_users table with minimal dependencies

-- Create staff_users table
CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'marketing', 'support', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT staff_users_pkey PRIMARY KEY (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON public.staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_active ON public.staff_users(is_active);

-- Enable RLS
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy (allow all for now)
CREATE POLICY "Allow all operations on staff_users" ON public.staff_users
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_staff_users_updated_at
  BEFORE UPDATE ON public.staff_users
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_users_updated_at();

-- Insert default admin staff user (password: admin123!)
INSERT INTO public.staff_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@rescuemanager.eu',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123!
  'Admin Staff',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert default marketing staff user (password: marketing123!)
INSERT INTO public.staff_users (email, password_hash, full_name, role, is_active)
VALUES (
  'marketing@rescuemanager.eu',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- marketing123!
  'Marketing Staff',
  'marketing',
  true
) ON CONFLICT (email) DO NOTHING;
