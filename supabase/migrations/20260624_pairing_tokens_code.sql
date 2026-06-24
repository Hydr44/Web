-- 20260624_pairing_tokens_code.sql
--
-- Aggiunge un CODICE CORTO leggibile come alternativa al QR per il pairing
-- desktop → mobile. L'autista può DIGITARE questo codice sull'app invece di
-- inquadrare il QR (utile se la fotocamera non funziona o il telefono è lontano
-- dallo schermo). Stesso record `pairing_tokens`, stesso single-use via `jti`,
-- stessa scadenza (`expires_at`). Il QR resta invariato.
--
-- Idempotente.

alter table public.pairing_tokens
  add column if not exists pair_code text;

-- Lookup veloce per codice + unicità tra i codici ATTIVI (non ancora usati).
-- Codici di token già usati possono ripetersi senza problemi: lo spazio è
-- 30^8 (~6.5e11) e la generate riprova in caso di collisione.
create unique index if not exists uq_pairing_tokens_active_code
  on public.pairing_tokens (pair_code)
  where used_at is null and pair_code is not null;

comment on column public.pairing_tokens.pair_code is
  'Codice corto alfanumerico (8 char, alfabeto senza caratteri ambigui 0/O/1/I/L/U) digitabile sul mobile come alternativa al QR. Stesso single-use via jti, stessa scadenza expires_at.';
