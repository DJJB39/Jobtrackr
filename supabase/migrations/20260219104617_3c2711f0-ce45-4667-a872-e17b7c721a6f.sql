
-- Create user_stages table for custom pipeline stages
CREATE TABLE public.user_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stage_id text NOT NULL,
  title text NOT NULL,
  color_class text NOT NULL,
  position integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, stage_id)
);

-- Enable RLS
ALTER TABLE public.user_stages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own stages"
  ON public.user_stages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stages"
  ON public.user_stages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stages"
  ON public.user_stages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stages"
  ON public.user_stages FOR DELETE
  USING (auth.uid() = user_id);

-- Function to seed default stages for new users
CREATE OR REPLACE FUNCTION public.seed_default_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_stages (user_id, stage_id, title, color_class, position) VALUES
    (NEW.id, 'found', 'Found', 'bg-status-found', 0),
    (NEW.id, 'applied', 'Applied', 'bg-status-applied', 1),
    (NEW.id, 'phone', 'Phone Screen', 'bg-status-phone', 2),
    (NEW.id, 'interview2', '2nd Interview', 'bg-status-interview2', 3),
    (NEW.id, 'final', 'Final Interview', 'bg-status-final', 4),
    (NEW.id, 'offer', 'Offer', 'bg-status-offer', 5),
    (NEW.id, 'accepted', 'Accepted', 'bg-status-accepted', 6),
    (NEW.id, 'rejected', 'Rejected', 'bg-status-rejected', 7);
  RETURN NEW;
END;
$$;

-- Trigger to auto-seed stages on user creation
CREATE TRIGGER on_auth_user_created_seed_stages
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_stages();
