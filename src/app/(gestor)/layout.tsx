import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Flame } from "lucide-react";
import Link from "next/link";

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/80 shadow-sm text-primary-foreground group-hover:scale-105 transition-transform">
              <Flame className="h-4 w-4" />
           </div>
           <span className="font-bold tracking-tight text-foreground">App Faixa Preta</span>
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
