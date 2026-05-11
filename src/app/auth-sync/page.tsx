"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase/client";
import { Flame, ShieldAlert, Copy, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthSyncPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const supabase = useSupabase();
  const [debugInfo, setDebugInfo] = useState<{email: string; clerkId: string; reason: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!userLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const syncAndRoute = async () => {
      try {
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error("Usuário sem e-mail");
        const clerkId = user.id;

        // Em vez de consultar as tabelas diretamente (o que falha se o RLS bloquear porque 
        // o clerk_user_id está desatualizado), chamamos a função RPC segura.
        const { data: syncData, error: syncError } = await supabase.rpc('sync_user_by_email', {
          p_email: email,
          p_clerk_user_id: clerkId
        });

        if (syncError) {
          console.error("auth-sync: Erro ao chamar RPC sync_user_by_email:", syncError);
        }

        // 1. É Gestor/Professor?
        if (syncData?.type === 'GESTOR') {
          router.push("/dashboard");
          return;
        }

        // 2. É Aluno?
        if (syncData?.type === 'ALUNO') {
          router.push("/aluno");
          return;
        }

        // Se chegou aqui, não encontrou
        // Continua com o fallback local ou renderiza o erro

        // 3. Fallback localhost (desenvolvimento)
        if (typeof window !== "undefined" && window.location.hostname === "localhost") {
           console.warn("DEV BYPASS: Permitindo acesso de gestor por estar em localhost.");
           router.push("/dashboard");
           return;
        }

        // 4. Email desconhecido — salva info de debug detalhado
        const details: string[] = [];
        if (syncError) {
          details.push(`RPC ERRO: ${syncError.message} (code: ${syncError.code})`);
        } else {
          details.push(`Email não encontrado em nenhuma academia.`);
          details.push(`Retorno RPC: ${syncData ? JSON.stringify(syncData) : 'NULL'}`);
        }
        
        const reason = details.join(' | ');
        setDebugInfo({ email, clerkId, reason });
        setIsChecking(false);
        
      } catch (err) {
        console.error("Erro na sincronização de acesso:", err);
        const email = user?.emailAddresses[0]?.emailAddress || 'desconhecido';
        setDebugInfo({ email, clerkId: user?.id || '', reason: `Exceção: ${err}` });
        setIsChecking(false);
      }
    };

    syncAndRoute();
  }, [user, userLoaded, router, supabase]);

  // Tela de loading enquanto verifica acesso (elimina o flash de "Acesso Retido")
  if (!userLoaded || !user || isChecking) return (
     <div className="min-h-screen flex items-center justify-center bg-background">
       <div className="flex flex-col items-center gap-4">
         <div className="relative">
           <Flame className="w-12 h-12 text-primary opacity-50" />
           <Loader2 className="w-6 h-6 text-primary animate-spin absolute -bottom-1 -right-1" />
         </div>
         <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm animate-pulse">Verificando acesso...</p>
       </div>
     </div>
  );

  const copyClerkId = () => {
    if (debugInfo?.clerkId) {
      navigator.clipboard.writeText(debugInfo.clerkId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
       <div className="max-w-md w-full bg-card rounded-3xl p-8 shadow-xl text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-red-50 flex flex-col items-center justify-center mb-6 ring-8 ring-red-50/50">
             <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2 tracking-tight">Acesso Retido</h1>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-6">
             O seu e-mail (<span className="font-bold text-foreground">{user?.emailAddresses[0]?.emailAddress}</span>) ainda não foi autorizado em nossa base.
             <br/><br/>
             Se você é responsável por um atleta, <b>solicite à direção que cadastre exatamente este seu e-mail na ficha do aluno(a)</b>. O aplicativo será liberado instantaneamente.
          </p>

          {/* Debug Info - Visível para diagnóstico */}
          {debugInfo && (
            <div className="w-full mb-6 p-4 bg-muted/50 rounded-xl text-left space-y-2">
              <p className="text-xs text-muted-foreground font-mono">
                <span className="font-bold text-foreground">Clerk ID:</span>{" "}
                <span className="select-all">{debugInfo.clerkId}</span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                <span className="font-bold text-foreground">Motivo:</span> {debugInfo.reason}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-2"
                onClick={copyClerkId}
              >
                {copied ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? 'Copiado!' : 'Copiar Clerk ID (para suporte)'}
              </Button>
            </div>
          )}

          <div className="w-full flex gap-3">
             <Button variant="outline" className="w-full" onClick={() => router.push("/sign-in")}>
               Voltar ao Login
             </Button>
          </div>
       </div>
    </div>
  );
}
