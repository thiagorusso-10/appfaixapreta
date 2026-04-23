-- Migration Script: Executar no SQL Editor do Supabase para adicionar as colunas que faltavam na tabela students
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS modality TEXT DEFAULT 'Judô';
