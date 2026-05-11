import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';
import { useRef } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis de ambiente do Supabase não encontradas. Verifique seu arquivo .env.local');
}

// Referência global para evitar múltiplas instâncias do GoTrueClient
let globalClient: SupabaseClient | null = null;

/**
 * Hook para acessar o Supabase no Client Side.
 * Ele automaticamente injeta o token JWT do Clerk nas requisições,
 * o que faz com que o RLS do Supabase (postgres) saiba QUEM está pedindo os dados.
 * 
 * Usa singleton para evitar "Multiple GoTrueClient instances".
 */
export function useSupabase() {
  const { getToken, userId } = useAuth();
  // Armazena referência estável ao getToken para evitar recriação
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  if (!globalClient) {
    globalClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          try {
            // Tenta obter o token com o template do supabase (pode falhar se não configurado)
            const clerkToken = await getTokenRef.current({ template: 'supabase' }).catch(() => null);
            
            const headers = new Headers(options?.headers);
            if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`);
            } else {
              // Fallback para o token padrão se o template não existir
              const defaultToken = await getTokenRef.current().catch(() => null);
              if (defaultToken) headers.set('Authorization', `Bearer ${defaultToken}`);
            }

            // INJEÇÃO DE EMERGÊNCIA (Fallback de RLS):
            // Passamos o userId no header caso o JWT não seja validado pelo Supabase
            if (userId) {
              headers.set('x-clerk-user-id', userId);
            }

            return fetch(url, {
              ...options,
              headers,
            });
          } catch (e) {
            console.error("useSupabase: Erro ao obter token do Clerk:", e);
            return fetch(url, options);
          }
        },
      },
    });
  }

  return globalClient;
}
