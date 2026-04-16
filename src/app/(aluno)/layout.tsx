"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { Building2, Home, DollarSign } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { academy } = useAcademy();
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-background md:bg-muted flex justify-center">
      {/* Container mobile simulado para desktop, full size on real mobile */}
      <div className="w-full h-full min-h-screen max-w-md bg-background shadow-xl flex flex-col relative pb-16">
        {/* App Header Mobile */}
        <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
           {academy?.logoUrl ? (
            <img src={academy.logoUrl} alt={academy.name} className="h-8 w-8 rounded-full object-cover shadow-sm bg-muted" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <span className="font-semibold text-lg text-foreground">
            {academy?.name || "Faixa Preta"}
          </span>
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
        </nav>
      </div>
    </div>
  );
}
