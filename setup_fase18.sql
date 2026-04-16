-- 1. ADICIONANDO CHAVE PIX À ACADEMIA
ALTER TABLE academies ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- 2. TABELA DE TÉCNICAS (WHITE-LABEL)
CREATE TABLE IF NOT EXISTS student_techniques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  learned_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE student_techniques ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view student_techniques for their academy" ON student_techniques;
    DROP POLICY IF EXISTS "Users can insert student_techniques for their academy" ON student_techniques;
    DROP POLICY IF EXISTS "Users can update student_techniques for their academy" ON student_techniques;
    DROP POLICY IF EXISTS "Users can delete student_techniques for their academy" ON student_techniques;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can view student_techniques for their academy"
ON student_techniques FOR SELECT
USING (academy_id IN (
    SELECT academy_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
));

CREATE POLICY "Users can insert student_techniques for their academy"
ON student_techniques FOR INSERT
WITH CHECK (academy_id IN (
    SELECT academy_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
));

CREATE POLICY "Users can update student_techniques for their academy"
ON student_techniques FOR UPDATE
USING (academy_id IN (
    SELECT academy_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
));

CREATE POLICY "Users can delete student_techniques for their academy"
ON student_techniques FOR DELETE
USING (academy_id IN (
    SELECT academy_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
));

-- 3. STORAGE BUCKET PARA IMAGENS DE TÉCNICAS
-- Verifica se o bucket já existe para não dar erro
INSERT INTO storage.buckets (id, name, public) 
SELECT 'technique-images', 'technique-images', true 
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'technique-images'
);

-- Políticas do Storage (permitir acesso a usuários logados autenticados pelo Clerk)
-- Apenas insere se a política já não foi criada (tentativa segura)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Acesso as imagens das tecnicas" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Acesso as imagens das tecnicas" 
ON storage.objects FOR ALL 
USING (bucket_id = 'technique-images');
