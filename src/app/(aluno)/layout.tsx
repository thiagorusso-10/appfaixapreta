"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { StudentProvider, useStudent } from "@/contexts/StudentContext";
import { Building2, Home, DollarSign, Palette, BookOpen, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { PRESET_THEMES, generateCustomTheme } from "@/lib/themes";

// Cores das faixas para o card de seleção
const BELT_COLORS: Record<string, string> = {
  'BRANCA': '#e2e8f0', 'CINZA': '#94a3b8', 'AZUL': '#3b82f6',
  'AMARELA': '#eab308', 'LARANJA': '#f97316', 'VERDE': '#22c55e',
  'ROXA': '#a855f7', 'MARROM': '#92400e', 'PRETA': '#1e293b',
  'Branca': '#e2e8f0', 'Cinza': '#94a3b8', 'Azul': '#3b82f6',
  'Amarela': '#eab308', 'Laranja': '#f97316', 'Verde': '#22c55e',
  'Roxa': '#a855f7', 'Marrom': '#92400e', 'Preta': '#1e293b',
};

function StudentSelectorScreen() {
  const { siblings, selectStudent } = useStudent();
  const { academy } = useAcademy();

  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col items-center px-4 py-12">
        {/* Logo / Ícone */}
        <div className="mb-8 text-center">
          {academy?.logoUrl ? (
            <img src={academy.logoUrl} alt={academy.name} className="h-16 w-16 rounded-2xl object-cover shadow-lg mx-auto mb-4 bg-muted" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mx-auto mb-4 shadow-lg">
              <Building2 className="h-8 w-8" />
            </div>
          )}
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Qual atleta você quer acompanhar?
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Selecione o perfil para continuar
          </p>
        </div>

        {/* Cards dos Filhos */}
        <div className="w-full space-y-3">
          {siblings.map((child) => {
            const beltColor = BELT_COLORS[child.beltRank] || '#3b82f6';
            return (
              <button
                key={child.id}
                onClick={() => selectStudent(child.id)}
                className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 border-0 
                           hover:bg-secondary/40 active:scale-[0.98] transition-all duration-200 
                           cursor-pointer text-left group"
              >
                {/* Avatar */}
                {child.avatarUrl ? (
                  <img 
                    src={child.avatarUrl} 
                    alt={child.name} 
                    className="h-14 w-14 rounded-xl object-cover border-2 shadow-md shrink-0" 
                    style={{ borderColor: beltColor }}
                  />
                ) : (
                  <div 
                    className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0"
                    style={{ backgroundColor: beltColor }}
                  >
                    {child.name.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                    {child.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="h-3 w-3 rounded-full border border-border shadow-sm shrink-0" 
                      style={{ backgroundColor: beltColor }} 
                    />
                    <span className="text-sm text-muted-foreground">
                      Faixa {child.beltRank}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-muted-foreground/30 group-hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground/50 mt-8 text-center">
          Você pode trocar de atleta a qualquer momento pelo menu do app
        </p>
      </div>
    </div>
  );
}

function AlunoLayoutInner({ children }: { children: React.ReactNode }) {
  const { academy, applyTheme, activeTheme } = useAcademy();
  const { selectedStudent, siblings, needsSelection, switchStudent, isLoading } = useStudent();
  const pathname = usePathname();

  // Loading
  if (isLoading || !academy) return null;

  // Tela de seleção quando há 2+ filhos e nenhum selecionado
  if (needsSelection) return <StudentSelectorScreen />;

  // Se não encontrou nenhum aluno (email não cadastrado)
  if (!selectedStudent && !needsSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Aluno não encontrado no banco de dados.</p>
        </div>
      </div>
    );
  }

  const hasSiblings = siblings.length > 1;

  return (
    <div className="min-h-screen w-full bg-background md:bg-muted flex justify-center">
      <div className="w-full h-full min-h-screen max-w-md bg-background shadow-xl flex flex-col relative pb-16">
        {/* App Header Mobile */}
        <header className="flex items-center p-4 border-b border-border bg-card">
           <div className="flex items-center gap-3">
             {academy?.logoUrl ? (
              <img src={academy.logoUrl} alt={academy.name} className="h-8 w-8 rounded-full object-cover shadow-sm bg-muted" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
            )}
            <span className="font-semibold text-lg text-foreground line-clamp-1">
              {academy?.name || "Carregando..."}
            </span>
           </div>

           <div className="ml-auto flex items-center gap-2">
             {/* Botão de trocar de filho — só aparece se tem 2+ filhos */}
             {hasSiblings && (
               <button
                 onClick={switchStudent}
                 className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-3 py-1.5 text-xs font-bold transition-colors active:scale-95"
                 title="Trocar de atleta"
               >
                 <ArrowLeftRight className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">Trocar</span>
               </button>
             )}

             <div className="relative flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
                <Palette className="w-4 h-4 text-muted-foreground ml-1" />
                <select 
                  value={activeTheme.id === "custom" ? "custom" : activeTheme.id}
                  onChange={(e) => {
                    if (e.target.value === "custom") return;
                    const selected = PRESET_THEMES.find(t => t.id === e.target.value);
                    if (selected) applyTheme(selected);
                  }}
                  className="bg-transparent border-none text-xs font-medium outline-none cursor-pointer text-foreground appearance-none pr-2"
                >
                  <option disabled value="">Temas</option>
                  {PRESET_THEMES.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                  <option value="custom">Cores Livres ➜</option>
                </select>
                <input 
                  type="color" 
                  value={activeTheme.vars["--primary"] || "#3B82F6"}
                  onChange={(e) => {
                    const color = e.target.value;
                    const theme = generateCustomTheme(color);
                    applyTheme(theme);
                  }}
                  className="w-6 h-6 p-0 border-0 rounded-full cursor-pointer overflow-hidden outline-none bg-transparent"
                  title="Escolha uma cor customizada"
                />
             </div>

             <UserButton />
           </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-8">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-card border-t border-border/50 flex items-center justify-around h-16 px-2 self-end">
          <Link 
            href="/aluno" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname === '/aluno' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Início</span>
          </Link>
          <Link 
            href="/aluno/financeiro" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname === '/aluno/financeiro' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-[10px] font-medium">Financeiro</span>
          </Link>
          <Link 
            href="/aluno/tecnicas" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname === '/aluno/tecnicas' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] font-medium">Técnicas</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentProvider>
      <AlunoLayoutInner>{children}</AlunoLayoutInner>
    </StudentProvider>
  );
}
