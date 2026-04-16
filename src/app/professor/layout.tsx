"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { User, ClipboardList, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { academy } = useAcademy();
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-background md:bg-muted flex justify-center">
      <div className="w-full h-full min-h-screen max-w-2xl bg-background shadow-xl flex flex-col relative pb-16">
        
        {/* Header Superior */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
           <div className="flex items-center gap-3">
             {academy?.logoUrl ? (
              <img src={academy.logoUrl} alt={academy.name} className="h-9 w-9 rounded-full shadow-sm object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                 {academy?.name.charAt(0) || "P"}
              </div>
            )}
             <div className="flex flex-col">
                <span className="font-bold text-base text-foreground leading-tight">Painel Professor</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">{academy?.name}</span>
             </div>
           </div>

           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors shrink-0" onClick={() => window.location.href = "/login"}>
              <LogOut className="h-5 w-5" />
           </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-8">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute md:static bottom-0 w-full bg-card border-t border-border/50 flex items-center justify-around h-16 px-2">
          <Link 
            href="/professor" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname === '/professor' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-[10px] font-medium">Minhas Aulas</span>
          </Link>
          <Link 
            href="/professor/alunos" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname === '/professor/alunos' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Alunos & Fichas</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
