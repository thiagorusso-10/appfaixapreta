"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useClerk } from "@clerk/nextjs";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  CreditCard,
  Target,
  PenTool,
  QrCode,
  DollarSign,
  Flame,
  Settings,
  LogOut,
  Sun,
  Moon,
  Layers,
  Swords
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { PRESET_THEMES } from "@/lib/themes";

const GESTOR_LINKS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gestão de Alunos", href: "/alunos", icon: Users },
  { name: "Gestão de Turmas", href: "/turmas", icon: Layers },
  { name: "Painel de Graduação", href: "/graduacoes", icon: Target },
  { name: "Grade de Aulas", href: "/aulas", icon: CalendarDays },
  { name: "Plano de Aula", href: "/plano-aula", icon: PenTool },
  { name: "Técnicas Aprendidas", href: "/tecnicas", icon: Swords },
  { name: "Totem QR Code", href: "/checkin-qr", icon: QrCode },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Planos", href: "/planos", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { academy, activeTheme, applyTheme } = useAcademy();

  // O estado de 'dark' agora é derivado diretamente do tema ativo
  const isDark = activeTheme.isDark;

  const toggleDarkMode = () => {
    // Alterna entre o tema 'Faixa Branca' (Light) e 'Faixa Preta' (Midnight/Dark)
    const nextTheme = isDark ? PRESET_THEMES[0] : PRESET_THEMES[1]; 
    applyTheme(nextTheme);
  };

  return (
    <div className="glass-sidebar flex h-screen w-64 flex-col">
      {/* Brand Header - Premium */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          {academy?.logoUrl ? (
            <img src={academy.logoUrl} alt={academy.name} className="h-10 w-10 rounded-xl object-cover shadow-md ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
              <Flame className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="truncate font-bold text-foreground text-sm tracking-tight">
              {academy?.name || "Faixa Preta"}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              Painel Gestor
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation - Premium */}
      <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {GESTOR_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-sm"
                  )}
                >
                  <link.icon className={cn(
                    "h-[18px] w-[18px] transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )} />
                  {link.name}
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground pulse-dot" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer Actions - Premium */}
        <div className="mt-8 space-y-1 border-t border-border/40 pt-4">
          <Link
            href="/settings"
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/settings")
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Settings className="h-[18px] w-[18px] transition-transform duration-200 group-hover:rotate-90" />
            Configurações
          </Link>
          <button
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
            onClick={toggleDarkMode}
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px] transition-transform duration-200 group-hover:rotate-180" />
            ) : (
              <Moon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-rotate-12" />
            )}
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive/70 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => signOut(() => router.push("/login"))}
          >
            <LogOut className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-0.5" />
            Sair
          </button>
        </div>
      </nav>
    </div>
  );
}
