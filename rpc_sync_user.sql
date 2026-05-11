-- =========================================================================================
-- 🚨 CORREÇÃO DE LOGIN / RLS (Bypass Seguro para Auth Sync)
-- =========================================================================================
-- O PROBLEMA: Se o clerk_user_id no banco estiver vazio ou diferente do Clerk (ex: 
-- você excluiu a conta no Clerk e recriou), o Row Level Security (RLS) bloqueia a 
-- leitura do seu próprio email, resultando em "Acesso Retido".
--
-- A SOLUÇÃO: Esta função "SECURITY DEFINER" ignora o RLS apenas para verificar o email
-- no momento do login e atualizar o clerk_user_id automaticamente.
-- =========================================================================================

CREATE OR REPLACE FUNCTION sync_user_by_email(p_email text, p_clerk_user_id text)
RETURNS json AS $$
DECLARE
  v_user_record RECORD;
  v_student_record RECORD;
BEGIN
  -- 1. Verifica se é GESTOR ou PROFESSOR
  SELECT id, role, academy_id INTO v_user_record 
  FROM users 
  WHERE email ILIKE p_email 
  LIMIT 1;

  IF v_user_record.id IS NOT NULL THEN
    -- Se encontrou, garante que o clerk_user_id está atualizado (Self-healing)
    UPDATE users 
    SET clerk_user_id = p_clerk_user_id 
    WHERE id = v_user_record.id 
      AND (clerk_user_id IS NULL OR clerk_user_id != p_clerk_user_id);
    
    RETURN json_build_object('type', 'GESTOR', 'role', v_user_record.role, 'academy_id', v_user_record.academy_id);
  END IF;

  -- 2. Verifica se é ALUNO
  SELECT id, academy_id INTO v_student_record 
  FROM students 
  WHERE email ILIKE '%' || p_email || '%' 
  LIMIT 1;

  IF v_student_record.id IS NOT NULL THEN
    RETURN json_build_object('type', 'ALUNO', 'academy_id', v_student_record.academy_id);
  END IF;

  -- 3. Não encontrou em lugar nenhum
  RETURN json_build_object('type', 'NOT_FOUND');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
