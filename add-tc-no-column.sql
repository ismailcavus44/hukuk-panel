-- TC Kimlik No kolonunu ekle
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tc_no text;

-- Kolon için açıklama ekle
COMMENT ON COLUMN public.clients.tc_no IS 'TC Kimlik Numarası';

