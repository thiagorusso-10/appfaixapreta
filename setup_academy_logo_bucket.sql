-- ============================================================
-- BUCKET DE LOGOS DAS ACADEMIAS NO SUPABASE STORAGE
-- Execute este script no SQL Editor do painel Supabase
-- ============================================================

-- 1. Cria o bucket publico para logos das academias
INSERT INTO storage.buckets (id, name, public)
SELECT 'academy-logos', 'academy-logos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'academy-logos'
);

-- 2. Políticas de acesso ao bucket

-- Remover políticas antigas se existirem
DO $$
BEGIN
    DROP POLICY IF EXISTS "Academy logos são públicas" ON storage.objects;
    DROP POLICY IF EXISTS "Usuários podem fazer upload de logo da sua academia" ON storage.objects;
    DROP POLICY IF EXISTS "Usuários podem atualizar logo da sua academia" ON storage.objects;
    DROP POLICY IF EXISTS "Usuários podem deletar logo da sua academia" ON storage.objects;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Leitura pública (qualquer visitante pode ver a logo)
CREATE POLICY "Academy logos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'academy-logos');

-- Upload (apenas usuários autenticados da academia)
CREATE POLICY "Usuários podem fazer upload de logo da sua academia"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'academy-logos');

-- Atualizar (substituir logo)
CREATE POLICY "Usuários podem atualizar logo da sua academia"
ON storage.objects FOR UPDATE
USING (bucket_id = 'academy-logos');

-- Deletar logo antiga
CREATE POLICY "Usuários podem deletar logo da sua academia"
ON storage.objects FOR DELETE
USING (bucket_id = 'academy-logos');

-- 3. Confirmar criação
SELECT id, name, public FROM storage.buckets WHERE id = 'academy-logos';
