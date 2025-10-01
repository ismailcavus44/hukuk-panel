-- Hasar bedeli için kolon
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS damage_amount numeric(15,2);
