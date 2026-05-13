-- Aggiorna formato numerazione preventivi: PR01/26 (PR + progressivo + anno 2 cifre)
-- Il contatore riparte ogni anno (matching quote_number LIKE 'PR%/YY').

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  yy TEXT := to_char(now(), 'YY');
  next_num INT;
  result TEXT;
BEGIN
  -- Trova il prossimo progressivo per l'anno corrente
  SELECT COALESCE(MAX(
    CASE
      WHEN quote_number ~ ('^PR(\d+)/' || yy || '$') THEN
        (regexp_match(quote_number, '^PR(\d+)/'))[1]::INT
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM lead_quotes
  WHERE quote_number LIKE ('PR%/' || yy);

  result := 'PR' || lpad(next_num::TEXT, 2, '0') || '/' || yy;
  RETURN result;
END;
$$;
