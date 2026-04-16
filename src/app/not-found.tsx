import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-24 w-24 bg-muted/50 text-muted-foreground flex items-center justify-center rounded-3xl rotate-12">
          <SearchX className="h-10 w-10 -rotate-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Página não encontrada</h2>
          <p className="text-muted-foreground text-sm">
            Parece que essa técnica ainda não existe no nosso plano de aula.
            Verifique o link ou retorne para o painel principal.
          </p>
        </div>

        <div className="pt-4">
          <Link href="/" className="inline-flex h-11 px-8 rounded-xl items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
