"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { Student } from "@/lib/types";

interface StudentContextType {
  /** O aluno atualmente selecionado */
  selectedStudent: Student | null;
  /** Lista de todos os alunos vinculados ao email do login (irmãos) */
  siblings: Student[];
  /** True quando há 2+ alunos e nenhum foi selecionado ainda */
  needsSelection: boolean;
  /** Seleciona um aluno pelo ID */
  selectStudent: (studentId: string) => void;
  /** Reseta a seleção para voltar à tela de escolha */
  switchStudent: () => void;
  /** Atualiza campos do aluno selecionado localmente (otimista) + refetch em background */
  patchSelectedStudent: (updates: Partial<Student>) => void;
  /** Dados carregando */
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType>({
  selectedStudent: null,
  siblings: [],
  needsSelection: false,
  selectStudent: () => {},
  switchStudent: () => {},
  patchSelectedStudent: () => {},
  isLoading: true,
});

export function useStudent() {
  return useContext(StudentContext);
}

const SESSION_KEY = "faixapreta_selected_student";

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { academy } = useAcademy();
  const { students, isLoading: apiLoading, refetch } = useApi(academy?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  // Override local para atualização otimista (ex: troca de avatar sem esperar refetch)
  const [localOverrides, setLocalOverrides] = useState<Partial<Student>>({});

  // Encontra todos os alunos vinculados ao email do login
  const siblings = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || students.length === 0) return [];
    return students.filter(
      (s) => s.email?.toLowerCase().includes(email.toLowerCase())
    );
  }, [user, students]);

  // Inicialização: recupera do sessionStorage ou auto-seleciona se só tem 1
  useEffect(() => {
    if (apiLoading) return;

    if (siblings.length === 0) {
      setInitialized(true);
      return;
    }

    // Se só tem 1 irmão, seleciona automaticamente
    if (siblings.length === 1) {
      setSelectedId(siblings[0].id);
      setInitialized(true);
      return;
    }

    // Se tem 2+, verifica se há seleção salva no sessionStorage
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved && siblings.some((s) => s.id === saved)) {
        setSelectedId(saved);
      }
    } catch (e) {
      // sessionStorage pode não estar disponível em SSR
    }
    setInitialized(true);
  }, [siblings, apiLoading]);

  // Persiste a seleção no sessionStorage
  useEffect(() => {
    if (selectedId) {
      try {
        sessionStorage.setItem(SESSION_KEY, selectedId);
      } catch (e) {}
    }
  }, [selectedId]);

  // Limpa overrides quando os dados reais do banco chegam (após refetch)
  useEffect(() => {
    if (Object.keys(localOverrides).length > 0) {
      setLocalOverrides({});
    }
  }, [students]);

  const selectedStudent = useMemo(() => {
    const base = siblings.find((s) => s.id === selectedId) || null;
    if (!base || Object.keys(localOverrides).length === 0) return base;
    // Mescla dados reais com overrides locais
    return { ...base, ...localOverrides };
  }, [siblings, selectedId, localOverrides]);

  const needsSelection = initialized && siblings.length > 1 && !selectedStudent;
  const isLoading = apiLoading || !initialized;

  const selectStudent = (studentId: string) => {
    setSelectedId(studentId);
  };

  const switchStudent = () => {
    setSelectedId(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  };

  // Atualização otimista: atualiza a UI imediatamente + refetch em background
  const patchSelectedStudent = useCallback((updates: Partial<Student>) => {
    setLocalOverrides((prev) => ({ ...prev, ...updates }));
    // Refetch em background para sincronizar com o banco
    refetch();
  }, [refetch]);

  return (
    <StudentContext.Provider
      value={{
        selectedStudent,
        siblings,
        needsSelection,
        selectStudent,
        switchStudent,
        patchSelectedStudent,
        isLoading,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
