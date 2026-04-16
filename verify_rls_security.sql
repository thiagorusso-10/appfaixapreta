-- ============================================================
-- VERIFICAÇÃO DE RLS (Row Level Security) EM TODAS AS TABELAS
-- Execute no SQL Editor do Supabase para garantir segurança
-- ============================================================

-- 1. Lista todas as tabelas públicas e se RLS está ativo
SELECT 
  tablename AS tabela,
  CASE WHEN rowsecurity THEN '✅ RLS ATIVO' ELSE '🔴 SEM RLS!' END AS status_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- 2. Se houver tabelas sem RLS, ative com os comandos abaixo:
-- (Descomente as linhas necessárias)

-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_techniques ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

-- 3. Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operacao,
  qual AS condicao
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
