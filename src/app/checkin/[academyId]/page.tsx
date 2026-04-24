"use client";

import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, QrCode, Loader2, XCircle, ArrowLeft } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CheckInState = "loading" | "success" | "already" | "not_found" | "error";

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const academyId = params.academyId as string;
  
  const [state, setState] = useState<CheckInState>("loading");
  const [studentName, setStudentName] = useState("");
  const [academyName, setAcademyName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [streak, setStreak] = useState(0);

  const doCheckin = useCallback(async () => {
    if (!isLoaded || !user) return;

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      setState("error");
      setErrorMsg("Nenhum e-mail encontrado na sua conta.");
      return;
    }

    try {
      // 1. Buscar a academia pelo ID
      const { data: academy, error: academyError } = await supabase
        .from("academies")
        .select("id, name")
        .eq("id", academyId)
        .single();

      if (academyError || !academy) {
        setState("error");
        setErrorMsg("Academia não encontrada. Verifique se o QR Code é válido.");
        return;
      }
      setAcademyName(academy.name);

      // 2. Buscar o aluno pelo e-mail dentro da academia
      // O campo email pode conter múltiplos emails separados por vírgula
      // Então usamos ilike com % para buscar parcialmente
      const { data: studentsFound, error: studentError } = await supabase
        .from("students")
        .select("id, name, classes_attended")
        .eq("academy_id", academyId)
        .ilike("email", `%${userEmail}%`);

      const student = studentsFound && studentsFound.length > 0 ? studentsFound[0] : null;

      if (studentError || !student) {
        setState("not_found");
        setErrorMsg(`O e-mail "${userEmail}" não está cadastrado nesta academia.`);
        return;
      }
      setStudentName(student.name);

      // 3. Verificar se já fez check-in hoje
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      const { data: existing } = await supabase
        .from("checkins")
        .select("id")
        .eq("student_id", student.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (existing && existing.length > 0) {
        setState("already");
        return;
      }

      // 4. Registrar o check-in
      const { error: insertError } = await supabase
        .from("checkins")
        .insert([{
          academy_id: academyId,
          student_id: student.id,
        }]);

      if (insertError) {
        setState("error");
        setErrorMsg("Erro ao registrar presença: " + insertError.message);
        return;
      }

      // 5. Incrementar o contador de aulas do aluno
      await supabase
        .from("students")
        .update({ classes_attended: (student.classes_attended || 0) + 1 })
        .eq("id", student.id);

      // 6. Calcular streak
      const { data: recentCheckins } = await supabase
        .from("checkins")
        .select("created_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (recentCheckins) {
        const dates = recentCheckins.map(c => new Date(c.created_at).setHours(0, 0, 0, 0));
        const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);
        let currentStreak = 1;
        const maxGap = 1000 * 60 * 60 * 24 * 7;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          if (uniqueDates[i] - uniqueDates[i + 1] <= maxGap) {
            currentStreak++;
          } else break;
        }
        setStreak(currentStreak);
      }

      setState("success");

    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message || "Erro desconhecido");
    }
  }, [isLoaded, user, academyId]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push(`/sign-in?redirect_url=/checkin/${academyId}`);
      return;
    }
    if (isLoaded && user) {
      doCheckin();
    }
  }, [isLoaded, user, doCheckin, router, academyId]);

  const handleGoBack = () => {
    // Tenta voltar para a tela anterior. Se não tiver histórico, vai para o dashboard do aluno
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/aluno");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        
        {/* Card Principal */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center gap-3">
            <QrCode className="h-6 w-6 text-blue-400" />
            <div className="flex-1">
              <h1 className="text-white font-bold text-lg">Check-in via QR Code</h1>
              {academyName && <p className="text-white/60 text-xs">{academyName}</p>}
            </div>
          </div>

          {/* Body */}
          <div className="p-8 flex flex-col items-center text-center gap-5">

            {state === "loading" && (
              <>
                <div className="h-20 w-20 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                  <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Registrando presença...</p>
                  <p className="text-white/50 text-sm mt-1">Aguarde um momento</p>
                </div>
              </>
            )}

            {state === "success" && (
              <>
                <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-black text-2xl">Check-in realizado!</p>
                  <p className="text-white/70 text-base mt-1">Bom treino, <strong className="text-emerald-400">{studentName.split(' ')[0]}</strong>! 🥋</p>
                </div>
                {streak > 1 && (
                  <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
                    <span className="text-3xl">🔥</span>
                    <div className="text-left">
                      <p className="text-amber-400 font-bold text-sm">{streak} treinos seguidos!</p>
                      <p className="text-amber-400/60 text-xs">Sua ofensiva está incrível!</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {state === "already" && (
              <>
                <div className="h-20 w-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl">Já registrado hoje!</p>
                  <p className="text-white/60 text-sm mt-1">
                    Você já fez check-in hoje, <strong>{studentName.split(' ')[0]}</strong>. Boa dedicação! 💪
                  </p>
                </div>
              </>
            )}

            {state === "not_found" && (
              <>
                <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl">Aluno não encontrado</p>
                  <p className="text-white/60 text-sm mt-2">{errorMsg}</p>
                  <p className="text-white/40 text-xs mt-3">Fale com seu professor para verificar seu cadastro.</p>
                </div>
              </>
            )}

            {state === "error" && (
              <>
                <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl">Algo deu errado</p>
                  <p className="text-white/60 text-sm mt-2">{errorMsg}</p>
                </div>
              </>
            )}

          </div>

          {/* Botão Voltar (aparece após concluir o loading) */}
          {state !== "loading" && (
            <div className="px-6 pb-6">
              <button
                onClick={handleGoBack}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 border border-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar para o App
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="bg-white/5 px-6 py-4 border-t border-white/10 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Faixa Preta • Sistema de Gestão de Artes Marciais</p>
          </div>

        </div>
      </div>
    </div>
  );
}
