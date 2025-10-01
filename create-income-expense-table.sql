-- Gelir-gider takibi tablosu oluştur
CREATE TABLE IF NOT EXISTS public.income_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric(15,2) NOT NULL,
  description text NOT NULL,
  transaction_date date NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- RLS politikaları
ALTER TABLE public.income_expenses ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi oluşturdukları gelir-gider kayıtlarını görebilir
CREATE POLICY "Users can view their own income expenses" ON public.income_expenses
  FOR SELECT USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi gelir-gider kayıtlarını ekleyebilir
CREATE POLICY "Users can insert their own income expenses" ON public.income_expenses
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Kullanıcılar sadece kendi gelir-gider kayıtlarını güncelleyebilir
CREATE POLICY "Users can update their own income expenses" ON public.income_expenses
  FOR UPDATE USING (auth.uid() = created_by);

-- Kullanıcılar sadece kendi gelir-gider kayıtlarını silebilir
CREATE POLICY "Users can delete their own income expenses" ON public.income_expenses
  FOR DELETE USING (auth.uid() = created_by);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_income_expenses_case_id ON public.income_expenses(case_id);
CREATE INDEX IF NOT EXISTS idx_income_expenses_created_by ON public.income_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_income_expenses_transaction_date ON public.income_expenses(transaction_date);
CREATE INDEX IF NOT EXISTS idx_income_expenses_type ON public.income_expenses(type);
CREATE INDEX IF NOT EXISTS idx_income_expenses_category ON public.income_expenses(category);

