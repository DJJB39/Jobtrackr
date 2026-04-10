
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  job_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_logs_user_month
  ON public.ai_usage_logs (user_id, created_at);

ALTER TABLE public.user_preferences
  ADD COLUMN preferred_model text NOT NULL DEFAULT 'google/gemini-3-flash-preview';
