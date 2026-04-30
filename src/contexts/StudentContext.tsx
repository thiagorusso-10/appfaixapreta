"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
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
  /** Dados carregando */
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType>({
  selectedStudent: null,
  siblings: [],
  needsSelection: false,
  selectStudent: () => {},
  switchStudent: () => {},
  isLoading: true,
});

export function useStudent() {
  return useContext(StudentContext);
}

const SESSION_KEY = "faixapreta_selected_student";

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { academy } = useAcademy();
  const { students, isLoading: apiLoading } = useApi(academy?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Encontra todos os alunos vinculados ao email do login
  const siblings = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || students.length === 0) return [];
    return students.filter(
      (s) => s.email?.toLowerCase() === email.toLowerCase()
    );
  }, [user, students]);

  // Inicialização: recupera do sessionStorage ou auto-seleciona se só tem 1
  useEffect(() => {
    if (apiLoading || siblings.length === 0) return;

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

  const selectedStudent = useMemo(
    () => siblings.find((s) => s.id === selectedId) || null,
    [siblings, selectedId]
  );

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

  return (
    <StudentContext.Provider
      value={{
        selectedStudent,
        siblings,
        needsSelection,
        selectStudent,
        switchStudent,
        isLoading,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
