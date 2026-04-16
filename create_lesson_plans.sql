-- ==========================================
-- SCRIPT: TABELA DE PLANOS DE AULA
-- ==========================================
-- Se você já tem turmas (criada pelo setup_turmas.sql), esta tabela dependerá de referenciá-las.

CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,     -- Usaremos a nova tabela "turmas" em vez de "class_sessions"
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

-- Proteção Multi-tenant: Visível e mutável apenas para a própria academia
CREATE POLICY "Planos de aula restritos a academia logada" 
ON lesson_plans FOR ALL USING (academy_id = get_my_academy_id());

-- Índice para acelerar busca por turma (opcional estratégico)
CREATE INDEX IF NOT EXISTS idx_lesson_plans_turma_id ON lesson_plans(turma_id);
