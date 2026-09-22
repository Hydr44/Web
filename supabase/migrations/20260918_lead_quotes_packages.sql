-- Preventivi: pacchetti/servizi extra + regime IVA dei prezzi indicati
--
-- packages: array jsonb di voci
--   { key, name, description?, billing: 'one_time'|'monthly'|'note', price, quantity }
--   - one_time → sommato in one_time_total (con setup_fee), mai scontato
--   - monthly  → parte del canone (monthly_total), soggetto allo sconto %
--   - note     → voce informativa senza importo (es. "Pacchetto visure PRA a consumo")
-- one_time_total: setup_fee + pacchetti una tantum (calcolato dal lead-api)
-- prices_include_vat: true = i prezzi indicati sono IVA inclusa (default);
--   false = IVA esclusa, verrà applicata IVA 22% in fattura.
--
-- Additiva e idempotente: nessun impatto sui preventivi esistenti.

alter table public.lead_quotes
  add column if not exists packages jsonb not null default '[]'::jsonb,
  add column if not exists one_time_total numeric not null default 0,
  add column if not exists prices_include_vat boolean not null default true;

-- Backfill: i preventivi esistenti avevano solo il setup come una tantum
update public.lead_quotes
   set one_time_total = coalesce(setup_fee, 0)
 where one_time_total = 0 and coalesce(setup_fee, 0) > 0;

comment on column public.lead_quotes.packages is 'Pacchetti/servizi extra: [{key,name,description,billing(one_time|monthly|note),price,quantity}]';
comment on column public.lead_quotes.one_time_total is 'setup_fee + pacchetti una tantum (calcolato dal lead-api)';
comment on column public.lead_quotes.prices_include_vat is 'true = prezzi IVA inclusa (default); false = IVA esclusa, +22% in fattura';
