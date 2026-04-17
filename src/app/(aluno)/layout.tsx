"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { Building2, Home, DollarSign, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { PRESET_THEMES } from "@/lib/themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { academy, applyTheme, activeTheme } = useAcademy();
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-background md:bg-muted flex justify-center">
      {/* Container mobile simulado para desktop, full size on real mobile */}
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

           <div className="ml-auto flex items-center gap-3">
             <DropdownMenu>
                <DropdownMenuTrigger className="p-2 rounded-full hover:bg-muted transition-colors outline-none">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Aparência (Temas)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PRESET_THEMES.map(theme => (
                    <DropdownMenuItem 
                      key={theme.id} 
                      onClick={() => applyTheme(theme)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: theme.vars["--primary"] }} />
                      <span className={activeTheme.id === theme.id ? "font-bold" : ""}>{theme.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
             </DropdownMenu>

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
        </nav>
      </div>
    </div>
  );
}
