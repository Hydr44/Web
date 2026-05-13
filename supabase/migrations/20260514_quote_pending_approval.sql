-- Aggiunge 'pending_approval' all'enum status di lead_quotes
-- (preventivi creati con requires_approval=true)

ALTER TABLE lead_quotes DROP CONSTRAINT IF EXISTS lead_quotes_status_check;
ALTER TABLE lead_quotes ADD CONSTRAINT lead_quotes_status_check
  CHECK (status IN (
    'draft', 'pending_approval', 'sent', 'viewed',
    'accepted', 'rejected', 'paid',
    'pending_activation', 'activated',
    'expired', 'cancelled', 'superseded'
  ));
