-- Migration: Webhook events idempotency table
-- File: supabase/migrations/20260731010000_webhook_events.sql

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events (event_id);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admin / service_role can manage webhook_events
CREATE POLICY "Admins manage webhook_events"
  ON public.webhook_events
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
