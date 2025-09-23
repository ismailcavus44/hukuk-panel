-- Masraf takibi tablosu oluştur
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  expense_date date NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- RLS politikaları
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi oluşturdukları masrafları görebilir
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi masraflarını ekleyebilir
CREATE POLICY "Users can insert their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Kullanıcılar sadece kendi masraflarını güncelleyebilir
CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi masraflarını silebilir
CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = created_by);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_expenses_case_id ON public.expenses(case_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
