"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase/client";
import { Flame, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthSyncPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const supabase = useSupabase();

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

        // 1. Procurar se é um GESTOR/PROFESSOR (Tabela users)
        // OBS: Por proteção (RLS restrito), usamos auth do Clerk e se houver permissão, vai retornar
        const { data: adminData } = await supabase
          .from("users")
          .select("role, academy_id")
          .eq("email", email)
          .single();

        if (adminData && (adminData.role === 'GESTOR' || adminData.role === 'PROFESSOR')) {
           // É da equipe da academia.
           router.push("/dashboard");
           return;
        }

        // 2. Procurar se é PAI/MÃE/ALUNO (Tabela students)
        // Usa `ilike` ou `like` para buscar email parcial para múltiplos responsáveis (ex: mae@gmail.com,pai@gmail.com)
        const { data: studentData } = await supabase
          .from("students")
          .select("id")
          .ilike("email", `%${email}%`);

        if (studentData && studentData.length > 0) {
           // Achou que ele é responsável por pelo menos 1 aluno!
           router.push("/aluno");
           return;
        }

        // 3. Fallback de Segurança Máxima (Exclusividade de Tenant)
        // Se a pessoa estiver rodando o código na própria máquina local (localhost),
        // damos um bypass emergencial para ele conseguir entrar no Dashboard e cadastrar as coisas,
        // já que a tabela users ainda está vazia e ele não me passou os e-mails oficiais.
        if (typeof window !== "undefined" && window.location.hostname === "localhost") {
           console.warn("DEV BYPASS: Permitindo acesso de gestor por estar em localhost.");
           router.push("/dashboard");
           return;
        }

        // 4. Email desconhecido (Novo cadastro que não tem permissões ainda)
        // Fica retido na página de erro de acesso sem permissão!
        
      } catch (err) {
        console.error("Erro na sincronização de acesso:", err);
      }
    };

    syncAndRoute();
  }, [user, userLoaded, router, supabase]);

  if (!userLoaded || !user) return (
     <div className="min-h-screen flex items-center justify-center bg-background">
       <div className="animate-pulse flex flex-col items-center">
         <Flame className="w-12 h-12 text-primary opacity-50 mb-4" />
         <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Autenticando</p>
       </div>
     </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
       <div className="max-w-md w-full bg-card rounded-3xl p-8 shadow-xl text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-red-50 flex flex-col items-center justify-center mb-6 ring-8 ring-red-50/50">
             <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2 tracking-tight">Acesso Retido</h1>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
             O seu e-mail (<span className="font-bold text-foreground">{user.emailAddresses[0]?.emailAddress}</span>) ainda não foi autorizado em nossa base.
             <br/><br/>
             Se você é responsável por um atleta, <b>solicite à direção que cadastre exatamente este seu e-mail na ficha do aluno(a)</b>. O aplicativo será liberado instantaneamente.
          </p>
          <div className="w-full flex gap-3">
             <Button variant="outline" className="w-full" onClick={() => router.push("/sign-in")}>
               Voltar ao Login
             </Button>
          </div>
       </div>
    </div>
  );
}
