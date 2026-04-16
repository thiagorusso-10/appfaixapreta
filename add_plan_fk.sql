-- Adiciona a coluna plan_id na tabela students
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- Verifica e cria o índice para a chave estrangeira melhorar a performance das consultas se não existir
CREATE INDEX IF NOT EXISTS idx_students_plan_id ON students(plan_id);

-- Opcional: Adiciona um comentário na coluna para documentação no banco
COMMENT ON COLUMN students.plan_id IS 'Referência ao plano comercial/assinatura do aluno. Opcional (avulso/isento).';
