-- Salt okunur kullanıcı için RLS politikaları
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- NOT: Kullanıcı zaten oluşturuldu (emre@sayhukuk.com)
-- Sadece RLS politikalarını güncelleyeceğiz

-- 6. RLS politikalarını güncelle (salt okunur kullanıcı da verileri görebilsin)
-- Mevcut politikaları genişlet:

-- Clients tablosu için salt okunur erişim
CREATE POLICY "readonly_clients_select" ON public.clients
  FOR SELECT USING (true);

-- Cases tablosu için salt okunur erişim  
CREATE POLICY "readonly_cases_select" ON public.cases
  FOR SELECT USING (true);

-- Documents tablosu için salt okunur erişim
CREATE POLICY "readonly_documents_select" ON public.documents
  FOR SELECT USING (true);

-- Calculations tablosu için salt okunur erişim
CREATE POLICY "readonly_calculations_select" ON public.calculations
  FOR SELECT USING (true);

-- Income/Expense tablosu için salt okunur erişim
CREATE POLICY "readonly_income_expenses_select" ON public.income_expenses
  FOR SELECT USING (true);

-- Tasks tablosu için salt okunur erişim (varsa)
-- CREATE POLICY "readonly_tasks_select" ON public.tasks
--   FOR SELECT USING (true);

-- Car dealers tablosu için salt okunur erişim (varsa)
-- CREATE POLICY "readonly_car_dealers_select" ON public.car_dealers
--   FOR SELECT USING (true);

-- Storage için salt okunur erişim
CREATE POLICY "readonly_storage_select" ON storage.objects
  FOR SELECT USING (true);
