ALTER TABLE public.pdf_history
ADD COLUMN IF NOT EXISTS file_url text;