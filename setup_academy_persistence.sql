-- ============================================================
-- PERSISTÊNCIA DA ACADEMIA NO SUPABASE
-- Execute este script no SQL Editor do painel Supabase
-- ============================================================

-- 1. Adiciona colunas que faltam na tabela academies
ALTER TABLE academies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS primary_color_hex TEXT DEFAULT '#3B82F6';
ALTER TABLE academies ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS document_number TEXT;

-- 2. RLS: Gestor pode ler e atualizar sua própria academia
-- (Assumindo que existe uma tabela 'users' com academy_id e clerk_user_id)

-- Política de leitura: qualquer usuário logado pode ver a academia
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their academy" ON academies;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can view their academy"
ON academies FOR SELECT
USING (
  id IN (
    SELECT academy_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  )
);

-- Política de atualização: apenas usuários da academia podem editar
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can update their academy" ON academies;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can update their academy"
ON academies FOR UPDATE
USING (
  id IN (
    SELECT academy_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  )
)
WITH CHECK (
  id IN (
    SELECT academy_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  )
);

-- 3. Verificar resultado
SELECT id, name, pix_key, logo_url, primary_color_hex FROM academies LIMIT 5;
