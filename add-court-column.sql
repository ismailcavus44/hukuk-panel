-- Cases tablosuna mahkeme alanı ekle
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS court_name text;

-- Kolon için açıklama ekle
COMMENT ON COLUMN public.cases.court_name IS 'Mahkeme adı (Mahrumiyet İcra Dosyası için)';

