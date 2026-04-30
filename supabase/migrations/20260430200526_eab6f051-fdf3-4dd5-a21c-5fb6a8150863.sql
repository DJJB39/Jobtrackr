-- New table: user_cvs (one row per user)
CREATE TABLE public.user_cvs (
  user_id uuid NOT NULL PRIMARY KEY,
  original_text text,
  cleaned_text text,
  original_score integer,
  cleaned_score integer,
  assessment_jsonb jsonb,
  cleanup_diff_jsonb jsonb,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cv"
  ON public.user_cvs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cv"
  ON public.user_cvs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cv"
  ON public.user_cvs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_cvs_updated_at
  BEFORE UPDATE ON public.user_cvs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend job_applications with AI scoring fields
ALTER TABLE public.job_applications
  ADD COLUMN ai_score integer,
  ADD COLUMN ai_score_reasons jsonb,
  ADD COLUMN ai_score_at timestamptz;