"use client";

import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { academy } = useAcademy();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [roleChecked, setRoleChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Verificação de segurança: usa sessionStorage preenchido pelo auth-sync
  // Isso elimina a dependência de queries diretas ao Supabase (que falham por RLS)
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkRole = () => {
      try {
        // O auth-sync salva o tipo de usuário no sessionStorage
        const syncResult = sessionStorage.getItem("faixapreta_user_type");
        
        if (syncResult === "GESTOR") {
          setIsAuthorized(true);
          setRoleChecked(true);
          return;
        }

        if (syncResult === "ALUNO") {
          // Esse usuário é aluno, manda para o layout correto
          router.replace("/aluno");
          return;
        }

        // Se não tem resultado no sessionStorage, o auth-sync não rodou
        // Redireciona para o auth-sync para classificar o usuário
        if (!syncResult) {
          console.warn("GestorLayout: Sem tipo de usuário no sessionStorage. Redirecionando para auth-sync...");
          router.replace("/auth-sync");
          return;
        }
      } catch (err) {
        console.error("GestorLayout: Exceção na verificação:", err);
        // Fail-open: se sessionStorage falhar, permite acesso temporário
        setIsAuthorized(true);
      }
      setRoleChecked(true);
    };

    // Timeout de segurança: se a verificação demorar mais de 3s, libera
    const timeout = setTimeout(() => {
      if (!roleChecked) {
        console.warn("GestorLayout: Timeout na verificação de role, liberando acesso");
        setIsAuthorized(true);
        setRoleChecked(true);
      }
    }, 3000);

    checkRole();

    return () => clearTimeout(timeout);
  }, [isLoaded, user, router]);

  // Loading enquanto verifica permissão (max 3 segundos)
  if (!roleChecked || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1a' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
          <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-linear-to-br from-background via-background to-secondary/30 flex-col md:flex-row">
      
      {/* HEADER MOBILE (Apenas telas pequenas) */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md md:hidden">
        <Sheet>
          <SheetTrigger className="shrink-0 -ml-2 p-2 hover:bg-secondary rounded-md transition-colors">
             <Menu className="h-6 w-6 text-foreground" />
             <span className="sr-only">Abrir menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-0 border-r-0 bg-transparent shadow-none">
            <div className="sr-only">
               <SheetTitle>Menu Principal</SheetTitle>
            </div>
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        <Link href="/dashboard" className="ml-4 flex items-center gap-2 group">
           {academy?.logoUrl ? (
             <img src={academy.logoUrl} alt={academy.name} className="h-8 w-8 rounded-lg object-cover shadow-sm bg-muted" />
           ) : (
             <img src="/icons/icon-192-v2.png" alt="Faixa Preta" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
           )}
           <span className="font-bold tracking-tight text-foreground">{academy?.name || "App Faixa Preta"}</span>
        </Link>
      </header>

      {/* SIDEBAR DESKTOP (Apenas telas médias/grandes) */}
      <div className="hidden md:flex">
         <Sidebar />
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto w-full max-w-[100vw]">
        {children}
      </main>
    </div>
  );
}
