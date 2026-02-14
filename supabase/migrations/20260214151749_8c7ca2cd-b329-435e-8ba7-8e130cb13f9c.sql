
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS push_subscription jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS push_notifications boolean NOT NULL DEFAULT false;
