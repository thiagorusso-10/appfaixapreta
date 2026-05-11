-- =========================================================================================
-- 🚨 CORREÇÃO DE SEGURANÇA: get_my_academy_id()
-- =========================================================================================
-- PROBLEMA: A função estava retornando SEMPRE o mesmo academy_id hardcoded,
-- permitindo que QUALQUER usuário logado (incluindo alunos) acessasse TODOS os dados.
--
-- CORREÇÃO: Agora lê o academy_id real do usuário logado via JWT do Clerk.
-- =========================================================================================

-- Corrige a função para usar o JWT real do Clerk
CREATE OR REPLACE FUNCTION get_my_academy_id() RETURNS uuid AS $$
  SELECT academy_id FROM users 
  WHERE clerk_user_id = public.clerk_user_id()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =========================================================================================
-- ⚠️  IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard
--     Após executar, verifique:
--     1. Login como gestor → deve funcionar normalmente
--     2. Login como aluno → não deve ver dados do gestor
-- =========================================================================================
