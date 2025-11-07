-- Add codice column to clients table
-- This field can be used as a unique identifier for clients
-- (e.g., customer code, internal code, etc.)

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS codice text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_codice ON public.clients(codice) WHERE codice IS NOT NULL;

-- Add unique constraint for codice (optional, only if it should be globally unique)
-- ALTER TABLE public.clients ADD CONSTRAINT clients_codice_unique UNIQUE (codice);
