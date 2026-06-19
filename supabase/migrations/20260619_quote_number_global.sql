-- =============================================================================
-- Numerazione preventivi GLOBALE per-anno + ATOMICA.
-- Fix: oggi riparte da 01 per ogni cliente (la funzione installata in prod conta
-- per lead_id). Qui la rendiamo unica su TUTTI i clienti e immune da race condition
-- (la vecchia MAX(...)+1 poteva collidere sulla UNIQUE lead_quotes.quote_number).
-- Formato invariato come stile: PR01/26, PR02/26, … (cresce a 3+ cifre oltre il 99,
-- non satura). Stesso nome/firma della RPC chiamata dal lead-api: generate_quote_number().
-- =============================================================================

-- Counter per anno (una riga per anno; incremento atomico).
CREATE TABLE IF NOT EXISTS public.quote_counters (
  year      int PRIMARY KEY,
  last_num  int NOT NULL DEFAULT 0
);
ALTER TABLE public.quote_counters ENABLE ROW LEVEL SECURITY; -- solo service_role (come il resto)

-- Seed del contatore dell'anno corrente dal MAX dei numeri PRxx/YY già esistenti,
-- così la numerazione CONTINUA (non ricomincia da 01 né collide con i preventivi attuali).
INSERT INTO public.quote_counters (year, last_num)
SELECT EXTRACT(YEAR FROM now())::int,
       COALESCE(MAX((regexp_match(quote_number, '^PR(\d+)/'))[1]::int), 0)
FROM public.lead_quotes
WHERE quote_number ~ ('^PR\d+/' || to_char(now(), 'YY') || '$')
ON CONFLICT (year) DO NOTHING;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yy text := to_char(now(), 'YY');
  yr int  := EXTRACT(YEAR FROM now())::int;
  n  int;
BEGIN
  -- Incremento atomico per anno: una sola istruzione → niente race condition,
  -- niente due preventivi con lo stesso numero.
  INSERT INTO public.quote_counters (year, last_num)
  VALUES (yr, 1)
  ON CONFLICT (year) DO UPDATE SET last_num = public.quote_counters.last_num + 1
  RETURNING last_num INTO n;

  RETURN 'PR' || lpad(n::text, 2, '0') || '/' || yy;
END;
$$;
