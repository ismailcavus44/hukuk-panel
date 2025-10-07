-- cases tablosuna tahkim alt kategorisi (DK/HF) için sütun ekleme
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS sub_category text;

COMMENT ON COLUMN public.cases.sub_category IS 'Tahkim Başvurusu için alt kategori (DK veya HF)';

-- Opsiyonel: Geçerli değerleri sınırlamak isterseniz aşağıdaki CHECK eklenebilir
-- NOT: Mevcut kayıtları etkilememek için koşullu bırakıyoruz
-- ALTER TABLE public.cases
--   ADD CONSTRAINT cases_sub_category_valid
--   CHECK (sub_category IS NULL OR sub_category IN ('DK','HF'));


