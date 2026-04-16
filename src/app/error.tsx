"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Pode logar para algum serviço de tracking aqui (ex: Sentry)
    console.error("ErrorBoundary Crash:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border/50 shadow-2xl rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto h-16 w-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-full">
          <AlertTriangle className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Algo deu errado!</h2>
          <p className="text-muted-foreground text-sm">
            Houve um problema inesperado de comunicação com nossos servidores. 
            Não se preocupe, seus dados estão salvos.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={() => reset()} className="w-full h-11 rounded-xl">
            <RotateCcw className="mr-2 h-4 w-4" /> Tentar Novamente
          </Button>
          <Link href="/" className="inline-flex w-full h-11 rounded-xl items-center justify-center border border-border bg-background hover:bg-muted text-sm font-medium">
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
