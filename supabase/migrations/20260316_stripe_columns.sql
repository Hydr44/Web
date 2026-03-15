-- Add Stripe columns to lead_quotes for checkout flow
ALTER TABLE lead_quotes
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for webhook lookup by session
CREATE INDEX IF NOT EXISTS idx_lead_quotes_stripe_session
  ON lead_quotes(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
