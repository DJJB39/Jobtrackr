
CREATE TABLE public.public_roast_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  roast_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX public_roast_log_ip_date_idx ON public.public_roast_log (ip_hash, roast_date);
CREATE INDEX public_roast_log_date_idx ON public.public_roast_log (roast_date);

GRANT ALL ON public.public_roast_log TO service_role;

ALTER TABLE public.public_roast_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.public_roast_log FOR ALL TO service_role USING (true) WITH CHECK (true);
