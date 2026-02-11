ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS salary text,
  ADD COLUMN IF NOT EXISTS close_date date;