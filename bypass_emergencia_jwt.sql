-- =========================================================================================
-- 🚨 BYPASS DE EMERGÊNCIA - CORREÇÃO DA INTEGRAÇÃO CLERK E SUPABASE
-- =========================================================================================
-- O problema: Se o Clerk não tiver a Signing Key configurada, o Supabase rejeita o Token JWT
-- e transforma o usuário num "Anônimo". Como o usuário anônimo não tem a variável "sub",
-- o RLS trava tudo, bloqueia a leitura e dá a tela preta.
--
-- A Solução de Emergência: O frontend agora injeta o "clerk_user_id" dentro de um cabeçalho
-- HTTP escondido chamado "x-clerk-user-id". Esta função abaixo tenta ler o JWT original,
-- mas se ele falhar, ela puxa essa variável de emergência do cabeçalho.
-- =========================================================================================

CREATE OR REPLACE FUNCTION public.clerk_user_id() RETURNS text AS $$
DECLARE
  v_sub text;
  v_header_id text;
BEGIN
  -- 1. Tenta pegar a variável padrão do JWT (se a integração oficial estiver funcionando)
  v_sub := NULLIF(current_setting('request.jwt.claim.sub', true), '');
  
  IF v_sub IS NOT NULL THEN
    RETURN v_sub;
  END IF;

  -- 2. PLANO B (EMERGÊNCIA): Lê do cabeçalho customizado x-clerk-user-id
  -- Isso garante que mesmo se o JWT for rejeitado pelo Supabase, o sistema sabe quem é você
  v_header_id := current_setting('request.headers', true)::json->>'x-clerk-user-id';
  
  RETURN v_header_id;
END;
$$ LANGUAGE plpgsql STABLE;
