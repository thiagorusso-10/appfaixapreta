import { useState, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/client';
import { Academy } from '@/lib/types';
import { useAuth } from '@clerk/nextjs';

/**
 * Hook dedicado para buscar e atualizar os dados da Academia no Supabase.
 * Garante que logo, nome, pix_key e cores sejam persistidos no banco,
 * não apenas no localStorage.
 */
export function useAcademyData() {
  const supabase = useSupabase();
  const { isLoaded, isSignedIn } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Busca a academia do usuário logado no Supabase.
   * Usa a tabela 'users' para encontrar o academy_id do usuário.
   */
  const fetchAcademy = useCallback(async (): Promise<Academy | null> => {
    if (!isLoaded || !isSignedIn) return null;

    try {
      // 1. Busca o usuário logado para obter o academy_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('academy_id')
        .limit(1)
        .single();

      if (userError || !userData?.academy_id) {
        console.warn('useAcademyData: Usuário sem academia vinculada.', userError);
        return null;
      }

      const academyId = userData.academy_id;

      // 2. Busca os dados da academia
      const { data: academyData, error: academyError } = await supabase
        .from('academies')
        .select('id, name, logo_url, primary_color_hex, pix_key, document_number')
        .eq('id', academyId)
        .single();

      if (academyError || !academyData) {
        console.warn('useAcademyData: Academia não encontrada.', academyError);
        return null;
      }

      // 3. Mapeia snake_case → camelCase
      const academy: Academy = {
        id: academyData.id,
        name: academyData.name,
        logoUrl: academyData.logo_url || undefined,
        primaryColorHex: academyData.primary_color_hex || '#3B82F6',
        pixKey: academyData.pix_key || undefined,
        documentNumber: academyData.document_number || '',
      };

      return academy;
    } catch (err) {
      console.error('useAcademyData: Erro ao buscar academia:', err);
      return null;
    }
  }, [supabase, isLoaded, isSignedIn]);

  /**
   * Salva as atualizações da academia no Supabase.
   */
  const saveAcademy = useCallback(async (academyId: string, updates: Partial<Academy>): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Converte camelCase → snake_case para o banco
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
      if (updates.primaryColorHex !== undefined) dbUpdates.primary_color_hex = updates.primaryColorHex;
      if (updates.pixKey !== undefined) dbUpdates.pix_key = updates.pixKey;
      if (updates.documentNumber !== undefined) dbUpdates.document_number = updates.documentNumber;

      const { error } = await supabase
        .from('academies')
        .update(dbUpdates)
        .eq('id', academyId);

      if (error) {
        console.error('useAcademyData: Erro ao salvar academia:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('useAcademyData: Exceção ao salvar academia:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [supabase]);

  return { fetchAcademy, saveAcademy, isSaving };
}
