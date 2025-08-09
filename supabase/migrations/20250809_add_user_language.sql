-- Add language preference to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS language TEXT;

-- Optional: constrain to supported languages
ALTER TABLE public.users
ADD CONSTRAINT users_language_check CHECK (language IS NULL OR language IN ('en','fr','de','uk','ru','es','it'));


