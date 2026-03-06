-- Admin quotes table for preventivi
CREATE TABLE IF NOT EXISTS admin_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
  org_name TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_company TEXT,
  client_phone TEXT,
  subject TEXT NOT NULL DEFAULT 'Preventivo RescueManager',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 22,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_admin_quotes_status ON admin_quotes(status);
CREATE INDEX IF NOT EXISTS idx_admin_quotes_client_email ON admin_quotes(client_email);

-- RLS disabled for admin-only table (accessed via service role key)
ALTER TABLE admin_quotes ENABLE ROW LEVEL SECURITY;
