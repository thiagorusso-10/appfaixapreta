-- ==========================================
-- SCRIPT DE ATUALIZAÇÃO: Gestão de Turmas
-- Execute este script no SQL Editor do seu Supabase.
-- ==========================================

-- 1. Cria a nova tabela 'turmas' para gestão pelo professor/gestor
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- Nome da turma. Ex: "Infantil Manhã"
  schedule TEXT,                          -- Horários livres. Ex: "Seg e Qua às 18:00"
  professor TEXT,                         -- Professor responsável
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ativação da Camada de Segurança (RLS) para 'turmas'
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;

-- 3. Política (Policy) de Segurança da Turma (usando o Helper já existente 'get_my_academy_id()')
CREATE POLICY "Turmas restritas a academia logada" 
ON turmas FOR ALL USING (academy_id = get_my_academy_id());

-- 4. Adiciona a relação de 'turma_id' nativa da tabela de Alunos (students)
-- O ON DELETE SET NULL não exclui os alunos se a turma for apagada, apenas remove o vículo.
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL;
