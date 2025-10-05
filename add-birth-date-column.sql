-- Müvekkil tablosuna doğum tarihi sütunu ekle
ALTER TABLE public.clients 
ADD COLUMN birth_date date;

-- Sütuna açıklama ekle
COMMENT ON COLUMN public.clients.birth_date IS 'Müvekkil doğum tarihi';
