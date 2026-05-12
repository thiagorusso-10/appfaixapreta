-- =========================================================================================
-- 🚨 CORREÇÃO DEFINITIVA DE RLS PARA ALUNOS E GESTORES (FIM DA TELA PRETA)
-- =========================================================================================
-- O problema: A tela preta acontece porque o `get_my_academy_id()` antigo só olhava para 
-- a tabela `users` (gestores/professores). Como alunos estão na tabela `students`, 
-- o RLS bloqueava tudo para eles, retornando `null` no frontend e causando a tela preta.
--
-- A solução: 
-- 1. Adicionar `clerk_user_id` na tabela `students` para vinculação segura.
-- 2. Atualizar o RPC de auth-sync para preencher esse ID quando o aluno logar.
-- 3. Atualizar o `get_my_academy_id()` para buscar a academia correta lendo de ambas as tabelas.
-- =========================================================================================

-- 1. Adiciona a coluna clerk_user_id na tabela students (se não existir)
ALTER TABLE students ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- 2. Atualiza a função RPC para também curar o clerk_user_id do aluno
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
    UPDATE users 
    SET clerk_user_id = p_clerk_user_id 
    WHERE id = v_user_record.id AND (clerk_user_id IS NULL OR clerk_user_id != p_clerk_user_id);
    
    RETURN json_build_object('type', 'GESTOR', 'role', v_user_record.role, 'academy_id', v_user_record.academy_id);
  END IF;

  -- 2. Verifica se é ALUNO
  SELECT id, academy_id INTO v_student_record 
  FROM students 
  WHERE email ILIKE '%' || p_email || '%' 
  LIMIT 1;

  IF v_student_record.id IS NOT NULL THEN
    UPDATE students 
    SET clerk_user_id = p_clerk_user_id 
    WHERE id = v_student_record.id AND (clerk_user_id IS NULL OR clerk_user_id != p_clerk_user_id);

    RETURN json_build_object('type', 'ALUNO', 'academy_id', v_student_record.academy_id);
  END IF;

  -- 3. Não encontrou em lugar nenhum
  RETURN json_build_object('type', 'NOT_FOUND');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualiza o Helper do RLS para reconhecer GESTORES e ALUNOS
CREATE OR REPLACE FUNCTION get_my_academy_id() RETURNS uuid AS $$
DECLARE
  v_clerk_id text;
  v_academy_id uuid;
BEGIN
  v_clerk_id := public.clerk_user_id();
  
  IF v_clerk_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Tenta achar em users primeiro
  SELECT academy_id INTO v_academy_id FROM users WHERE clerk_user_id = v_clerk_id LIMIT 1;
  
  -- Se achou, retorna
  IF v_academy_id IS NOT NULL THEN
    RETURN v_academy_id;
  END IF;

  -- Se não, tenta achar em students
  SELECT academy_id INTO v_academy_id FROM students WHERE clerk_user_id = v_clerk_id LIMIT 1;
  
  RETURN v_academy_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Atualiza a Policy de Alunos para permitir que o próprio aluno leia seu registro
-- mesmo se a política padrão de academia falhar no primeiro milissegundo de login.
DROP POLICY IF EXISTS "Alunos restritos a academia logada" ON students;
DROP POLICY IF EXISTS "Alunos restritos a academia logada ou o proprio perfil" ON students;

CREATE POLICY "Alunos restritos a academia logada ou o proprio perfil" 
ON students FOR ALL USING (
  academy_id = get_my_academy_id() OR clerk_user_id = public.clerk_user_id()
);
