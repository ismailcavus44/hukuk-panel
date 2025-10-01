-- Kaportacı tablosu oluştur
CREATE TABLE IF NOT EXISTS public.car_dealers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Cases tablosuna kaportacı alanı ekle
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS car_dealer_id uuid REFERENCES public.car_dealers(id) ON DELETE SET NULL;
-- Araç plaka kolonu
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS vehicle_plate text;

-- RLS politikaları
ALTER TABLE public.car_dealers ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi oluşturdukları kaportacıları görebilir
CREATE POLICY "Users can view their own car dealers" ON public.car_dealers
  FOR SELECT USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi kaportacılarını ekleyebilir
CREATE POLICY "Users can insert their own car dealers" ON public.car_dealers
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Kullanıcılar sadece kendi kaportacılarını güncelleyebilir
CREATE POLICY "Users can update their own car dealers" ON public.car_dealers
  FOR UPDATE USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi kaportacılarını silebilir
CREATE POLICY "Users can delete their own car dealers" ON public.car_dealers
  FOR DELETE USING (auth.uid() = created_by);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_car_dealers_created_by ON public.car_dealers(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_car_dealer_id ON public.cases(car_dealer_id);

