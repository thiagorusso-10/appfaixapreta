"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

/**
 * Página de Login — Redireciona para o fluxo real do Clerk.
 * Se o usuário já estiver logado, vai pro dashboard.
 * Se não, vai pro sign-in do Clerk.
 */
export default function LoginPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background glow sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/icons/icon-192-v2.png" alt="Faixa Preta" className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-primary/25 mb-4" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Faixa Preta</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de Academias de Artes Marciais</p>
        </div>

        {/* Card de Login */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Bem-vindo!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse o painel da sua academia com sua conta Google.
            </p>
          </div>

          <Button
            onClick={() => router.push("/sign-in")}
            className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 text-base"
          >
            Entrar na minha conta
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com os nossos termos de uso e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
