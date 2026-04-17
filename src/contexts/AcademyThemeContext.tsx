"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Academy } from "@/lib/types";
import { ThemeDefinition, PRESET_THEMES } from "@/lib/themes";
import { useSupabase } from "@/lib/supabase/client";
import { useAuth, useUser } from "@clerk/nextjs";

interface AcademyThemeContextType {
  academy: Academy | null;
  setAcademyId: (id: string) => void;
  updateAcademy: (updates: Partial<Academy>) => Promise<void>;
  saveAcademyToDb: () => Promise<boolean>;
  activeTheme: ThemeDefinition;
  applyTheme: (theme: ThemeDefinition) => void;
  isSaving: boolean;
}

const AcademyThemeContext = createContext<AcademyThemeContextType>({
  academy: null,
  setAcademyId: () => {},
  updateAcademy: async () => {},
  saveAcademyToDb: async () => false,
  activeTheme: PRESET_THEMES[0],
  applyTheme: () => {},
  isSaving: false,
});

export const AcademyThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeDefinition>(PRESET_THEMES[0]);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = useSupabase();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // ─── Fallback: setAcademy direto se precisar ───────────────
  const setAcademyId = (id: string) => {
    setAcademy(prev => ({
      id,
      name: prev?.name || "Busca em andamento...",
      primaryColorHex: prev?.primaryColorHex || "#3B82F6",
      documentNumber: prev?.documentNumber || ""
    }));
  };

  // ─── Atualiza localmente (estado React + localStorage) ───────────────
  const updateAcademy = useCallback(async (updates: Partial<Academy>) => {
    setAcademy(prev => {
      const next = prev ? { ...prev, ...updates } : prev;
      try {
        if (next) localStorage.setItem('academy-data', JSON.stringify(next));
      } catch(e) {}
      return next;
    });
  }, []);

  // ─── Persiste no Supabase ──────────────────────────────────────────────
  const saveAcademyToDb = useCallback(async (): Promise<boolean> => {
    if (!academy?.id) return false;
    setIsSaving(true);
    try {
      const dbPayload: Record<string, any> = {
        name: academy.name,
        pix_key: academy.pixKey ?? null,
        document_number: academy.documentNumber ?? null,
        primary_color_hex: academy.primaryColorHex ?? '#3B82F6',
        // logo_url: agora é uma URL pública do Supabase Storage (não base64)
        // O upload já salva logo_url diretamente na settings page.
        // Aqui garantimos que se tiver URL, ela sobe junto no save geral.
        logo_url: (academy.logoUrl && !academy.logoUrl.startsWith('data:')) 
          ? academy.logoUrl 
          : undefined,
      };

      const { error } = await supabase
        .from('academies')
        .update(dbPayload)
        .eq('id', academy.id);

      if (error) {
        console.error('saveAcademyToDb: erro ao salvar:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('saveAcademyToDb: exceção:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [academy, supabase]);

  // ─── Busca a academia do usuário no Supabase ──────────────────────────
  const fetchAcademyFromDb = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      let academyId: string | undefined;

      // Passo 1: Descobre qual academia pertence ao usuário logado (Gestores)
      const { data: userData } = await supabase
        .from('users')
        .select('academy_id')
        .limit(1)
        .single();

      if (userData?.academy_id) {
        academyId = userData.academy_id;
      } else if (user?.emailAddresses?.[0]?.emailAddress) {
        // Se não achou em users, tenta achar na tabela students (Alunos)
        const email = user.emailAddresses[0].emailAddress;
        // Pega a academia do primeiro aluno que tiver esse email cadastrado
        const { data: studentData } = await supabase
          .from('students')
          .select('academy_id')
          .ilike('email', `%${email}%`)
          .limit(1)
          .single();
          
        if (studentData?.academy_id) {
           academyId = studentData.academy_id;
        }
      }

      if (!academyId) {
        // Tenta buscar no localStorage como último recurso de ID
        const cached = localStorage.getItem('academy-data');
        if (cached) {
          const cachedAcademy = JSON.parse(cached);
          if (cachedAcademy.id) academyId = cachedAcademy.id;
        }
      }

      if (!academyId) {
        loadFromLocalStorageOrDefault();
        return;
      }

      // Passo 2: Busca os dados da academia
      const { data: academyData, error } = await supabase
        .from('academies')
        .select('id, name, logo_url, primary_color_hex, pix_key, document_number')
        .eq('id', academyId)
        .single();

      if (error || !academyData) {
        loadFromLocalStorageOrDefault();
        return;
      }

      // Passo 3: Monta o objeto Academy — logo_url agora vem direto do banco (URL do Storage)
      const dbAcademy: Academy = {
        id: academyData.id,
        name: academyData.name,
        primaryColorHex: academyData.primary_color_hex || '#3B82F6',
        pixKey: academyData.pix_key || undefined,
        documentNumber: academyData.document_number || '',
        logoUrl: academyData.logo_url || undefined, // URL pública do Supabase Storage
      };

      // Passo 4: Mescla com o cache local apenas se o banco estiver incompleto
      try {
        const cached = localStorage.getItem('academy-data');
        if (cached) {
          const cachedAcademy: Academy = JSON.parse(cached);
          // Se o banco não retornou logo, mas temos uma no cache que pertence a ESTA academia, mantém ela
          if (!dbAcademy.logoUrl && cachedAcademy.id === dbAcademy.id) {
            dbAcademy.logoUrl = cachedAcademy.logoUrl;
          }
        }
      } catch(e) {}

      setAcademy(dbAcademy);
      // Atualiza o cache local com dados frescos do banco
      try {
        localStorage.setItem('academy-data', JSON.stringify(dbAcademy));
      } catch(e) {}

    } catch (err) {
      console.warn('fetchAcademyFromDb: erro, usando fallback:', err);
      loadFromLocalStorageOrDefault();
    }
  }, [supabase, isLoaded, isSignedIn, user]);

  // ─── Fallback: localStorage → default ───────────────────────────────────
  const loadFromLocalStorageOrDefault = () => {
    try {
      const saved = localStorage.getItem('academy-data');
      if (saved) {
        setAcademy(JSON.parse(saved));
        return;
      }
    } catch(e) {}
    // Último recurso: fallback genérico
    setAcademyId("00000000-0000-0000-0000-000000000001");
  };

  // ─── Tema ──────────────────────────────────────────────────────────────
  const applyTheme = (theme: ThemeDefinition) => {
    if (!theme || !theme.vars) return;

    setActiveTheme(theme);
    const root = document.documentElement;
    
    // Proteção contra threads de renderização do Next.js
    requestAnimationFrame(() => {
      root.classList.toggle('dark', theme.isDark);
      Object.entries(theme.vars).forEach(([key, value]) => {
        if (value) root.style.setProperty(key, value);
      });
      if (theme.vars["--primary"]) {
        root.style.setProperty("--color-primary", theme.vars["--primary"]);
      }
    });

    try {
      localStorage.setItem('academy-theme-id', theme.id);
    } catch(e) {}
  };

  // ─── Efeito inicial: carrega dados ────────────────────────────────────
  useEffect(() => {
    // Carrega tema salvo
    try {
      const savedThemeId = localStorage.getItem('academy-theme-id');
      if (savedThemeId) {
        const found = PRESET_THEMES.find(t => t.id === savedThemeId);
        if (found) applyTheme(found);
        else applyTheme(activeTheme);
      } else {
        applyTheme(activeTheme);
      }
    } catch(e) {
      applyTheme(activeTheme);
    }
  }, []);

  // ─── Quando o auth estiver pronto, busca do banco ─────────────────────
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        fetchAcademyFromDb();
      } else {
        loadFromLocalStorageOrDefault();
      }
    }
  }, [isLoaded, isSignedIn]);

  return (
    <AcademyThemeContext.Provider value={{ academy, setAcademyId, updateAcademy, saveAcademyToDb, activeTheme, applyTheme, isSaving }}>
      {children}
    </AcademyThemeContext.Provider>
  );
};

export const useAcademy = () => useContext(AcademyThemeContext);
