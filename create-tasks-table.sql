-- İş takip sistemi için tasks tablosu
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  position integer NOT NULL DEFAULT 0,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS politikaları
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi oluşturdukları veya atanan görevleri görebilir
CREATE POLICY "Users can view their tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = created_by OR auth.uid() = assigned_to);

-- Kullanıcılar kendi görevlerini ekleyebilir
CREATE POLICY "Users can insert their tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Kullanıcılar kendi oluşturdukları görevleri güncelleyebilir
CREATE POLICY "Users can update their tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = created_by);

-- Kullanıcılar kendi oluşturdukları görevleri silebilir
CREATE POLICY "Users can delete their tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = created_by);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(position);
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON public.tasks(case_id);

-- Güncelleme zamanı için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

