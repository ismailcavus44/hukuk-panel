-- Dosya safahat takibi tablosu
CREATE TABLE IF NOT EXISTS public.case_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  progress_type text NOT NULL, -- 'sigorta_başvurusu', 'tahkim_başvurusu', 'hasar_fark', 'bilirkişi', 'değer_artırım', 'diğer'
  custom_description text, -- 'diğer' seçildiğinde manuel yazılan açıklama
  progress_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text, -- Ek notlar
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- RLS politikaları
ALTER TABLE public.case_progress ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi oluşturdukları safahat kayıtlarını görebilir
CREATE POLICY "Users can view their own case progress" ON public.case_progress
  FOR SELECT USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi safahat kayıtlarını ekleyebilir
CREATE POLICY "Users can insert their own case progress" ON public.case_progress
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Kullanıcılar sadece kendi safahat kayıtlarını güncelleyebilir
CREATE POLICY "Users can update their own case progress" ON public.case_progress
  FOR UPDATE USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi safahat kayıtlarını silebilir
CREATE POLICY "Users can delete their own case progress" ON public.case_progress
  FOR DELETE USING (auth.uid() = created_by);

-- Salt okunur kullanıcılar için politika
CREATE POLICY "readonly_case_progress_select" ON public.case_progress
  FOR SELECT USING (true);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_case_progress_case_id ON public.case_progress(case_id);
CREATE INDEX IF NOT EXISTS idx_case_progress_created_by ON public.case_progress(created_by);
CREATE INDEX IF NOT EXISTS idx_case_progress_progress_date ON public.case_progress(progress_date);
CREATE INDEX IF NOT EXISTS idx_case_progress_progress_type ON public.case_progress(progress_type);
