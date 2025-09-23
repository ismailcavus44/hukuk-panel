-- Sigorta başvurusu geri sayım sistemi için yeni kolonlar
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS insurance_application_date timestamptz;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS countdown_expires_at timestamptz;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS is_countdown_active boolean DEFAULT false;

-- Kolonlar için açıklamalar
COMMENT ON COLUMN public.cases.insurance_application_date IS 'Sigorta başvurusu tarihi';
COMMENT ON COLUMN public.cases.countdown_expires_at IS '15 günlük sürenin bittiği tarih';
COMMENT ON COLUMN public.cases.is_countdown_active IS 'Geri sayımın aktif olup olmadığı';
