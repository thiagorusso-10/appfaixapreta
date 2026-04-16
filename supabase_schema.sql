-- =========================================================================================
-- SCHEMA DO SUPABASE PARA APP JUDO ECNA (INTEGRADO COM CLERK)
-- =========================================================================================
-- Este script cria todas as tabelas necessárias, relaciona chaves estrangeiras, 
-- ativa o Row Level Security (RLS) e define as políticas baseadas no token JWT do Clerk.

-- Habilitar a extensão "uuid-ossp" se já não estiver ativada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABELA DE ACADEMIAS
-- ==========================================
CREATE TABLE IF NOT EXISTS academies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color_hex TEXT DEFAULT '#0F172A',
  document_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. TABELA DE USUÁRIOS (GESTORES / PROFESSORES)
-- OBS: Esta tabela vincula o ID do usuário no Clerk (clerk_user_id) à sua academia
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL, 
  role TEXT NOT NULL CHECK (role IN ('GESTOR', 'PROFESSOR', 'ALUNO')),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. TABELA DE ALUNOS
-- ==========================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  document_number TEXT,
  belt_rank TEXT NOT NULL,       -- Ex: 'BRANCA', 'AZUL', etc.
  belt_degree INTEGER NOT NULL DEFAULT 0, -- Grau dentro da faixa (0-4)
  status TEXT NOT NULL,          -- Ex: 'ATIVO', 'INATIVO'
  classes_attended INTEGER DEFAULT 0,
  classes_required_for_next_belt INTEGER DEFAULT 30,
  medical_notes TEXT,
  professor_notes TEXT,
  checkin_blocked BOOLEAN DEFAULT false,
  checkin_block_reason TEXT,
  avatar_url TEXT,
  is_exempt BOOLEAN DEFAULT false,
  is_ready_for_exam BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. TABELA DE HISTÓRICO DE GRADUAÇÕES
-- ==========================================
CREATE TABLE IF NOT EXISTS graduation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  from_belt TEXT NOT NULL,
  to_belt TEXT NOT NULL,
  graduation_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

-- ==========================================
-- 5. TABELA DE PAGAMENTOS (MENSALIDADES/LOJA)
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,          -- Ex: 'PAGO', 'PENDENTE', 'ATRASADO'
  due_date DATE NOT NULL,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. TABELA DE CHECK-INS
-- ==========================================
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 7. TABELA DE SESSÕES DE AULAS (GRADE)
-- ==========================================
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  modality TEXT NOT NULL,
  level TEXT NOT NULL,
  week_day INTEGER NOT NULL CHECK (week_day >= 0 AND week_day <= 6),
  time TEXT NOT NULL,
  max_students INTEGER DEFAULT 20,
  technique_of_the_day_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 8. TABELA DE PLANOS COMERCIAIS
-- ==========================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  recurring BOOLEAN DEFAULT true,
  classes_per_week TEXT,
  features TEXT[],
  is_popular BOOLEAN DEFAULT false,
  default_billing_day INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 9. TABELA DE TURMAS (NOVA GESTÃO DE GRUPOS FIXOS)
-- ==========================================
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schedule TEXT,
  professor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 10. TABELA DE PLANOS DE AULA
-- ==========================================
CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================================
-- CONFIGURAÇÕES DE ROW LEVEL SECURITY (RLS) COM INTEGRAÇÃO CLERK
-- =========================================================================================

-- Função Helper para ler o academy_id do usuário atual via JWT do Clerk
-- O Clerk envia um JWT e nós configuraremos o Supabase para entender o `sub` (clerk_user_id)
CREATE OR REPLACE FUNCTION public.clerk_user_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '');
$$ LANGUAGE sql STABLE;

-- ==========================================
-- 10. DADOS INICIAIS (MOCK PARA TESTE)
-- ==========================================
-- 1. Cria a academia base para testar
INSERT INTO academies (id, name, document_number, primary_color_hex)
VALUES ('00000000-0000-0000-0000-000000000001', 'Judo ECNA', '00.000.000/0001-00', '#10b981')
ON CONFLICT DO NOTHING;

-- 2. Na vida real, o Clerk Webhook insere o usuário aqui.
-- Para o teste, usamos uma function que simula a vinculação à Academia 1.
CREATE OR REPLACE FUNCTION get_my_academy_id() RETURNS uuid AS $$
BEGIN
  -- Num cenário real leríamos a tabela users filtrada pelo JWT.
  -- Ex: RETURN (SELECT academy_id FROM users WHERE clerk_user_id = public.clerk_user_id());
  RETURN '00000000-0000-0000-0000-000000000001'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar RLS em todas as tabelas
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Políticas (Policies) garantindo Multi-Tenant:
-- Cada usuário só pode ler/escrever dados da SUA própria Academy.

-- ACADEMIES: O usuário consegue ler a academia em que está vinculado.
CREATE POLICY "Academies visiveis para usuarios vinculados" 
ON academies FOR SELECT USING (id = get_my_academy_id());

-- USERS: O usuário lê apenas a si mesmo ou usuários de sua academia.
CREATE POLICY "Usuarios veem seu proprio profile e da mesma academia"
ON users FOR SELECT USING (academy_id = get_my_academy_id() OR clerk_user_id = public.clerk_user_id());

-- STUDENTS: Read/Insert/Update/Delete visíveis apenas na academia atual
CREATE POLICY "Alunos restritos a academia logada" 
ON students FOR ALL USING (academy_id = get_my_academy_id());

-- GRADUATION: Herdado da leitura do student respectivo
CREATE POLICY "Graduacoes restritas aos alunos da academia logada" 
ON graduation_history FOR ALL USING (
  student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id())
);

-- PAYMENTS: Read/Insert/Update/Delete visíveis apenas na academia logada
CREATE POLICY "Pagamentos restritos a academia logada" 
ON payments FOR ALL USING (academy_id = get_my_academy_id());

-- CHECKINS: Read/Insert/Update/Delete visíveis apenas na academia logada
CREATE POLICY "Checkins restritos a academia logada" 
ON checkins FOR ALL USING (academy_id = get_my_academy_id());

-- CLASS_SESSIONS (Antigo calendário, mantido por retrocompatibilidade)
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessoes restritas a academia logada" 
ON class_sessions FOR ALL USING (academy_id = get_my_academy_id());

-- PLANS: Read/Insert/Update/Delete visíveis apenas na academia logada
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planos restritos a academia logada" 
ON plans FOR ALL USING (academy_id = get_my_academy_id());

-- TURMAS: Visível e gerenciável apenas na academia vinculada
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Turmas restritas a academia logada"
ON turmas FOR ALL USING (academy_id = get_my_academy_id());

-- LESSON PLANS: Planos de aula restritos à academia vinculada
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planos de aula restritos a academia logada"
ON lesson_plans FOR ALL USING (academy_id = get_my_academy_id());

-- =========================================================================================
-- FIM DO SCRIPT DE SCHEMA DAS TABELAS
-- =========================================================================================

-- =========================================================================================
-- SUPABASE STORAGE (BUCKETS DE ARQUIVOS)
-- =========================================================================================

-- 1. Criação do Bucket "avatars" (Para fotos de perfil)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de RLS para o Array do Storage (Qualquer um pode fazer upload, leitura garantida pública)
-- Como o nome do arquivo é um UUID aleatório no frontend, não há colisão.
CREATE POLICY "Permitir leitura publica de avatares" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Permitir upload autenticado de avatares" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
CREATE POLICY "Permitir update autenticado de avatares" ON storage.objects FOR UPDATE WITH CHECK ( bucket_id = 'avatars' );
CREATE POLICY "Permitir delete autenticado de avatares" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' );
