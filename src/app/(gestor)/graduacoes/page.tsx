"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { type Student, BeltRank, formatBeltRank } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, CheckCircle2, ChevronDown, Sparkles, Undo2, Send, Clock } from "lucide-react";
import { useState } from "react";

const BELT_COLORS: Record<string, string> = {
  BRANCA: "bg-white text-black border-gray-300",
  "BRANCA/CINZA": "bg-[linear-gradient(90deg,#ffffff_62%,#9ca3af_62%)] text-black border-gray-400",
  CINZA: "bg-gray-400 text-white border-gray-500",
  "CINZA/AZUL": "bg-[linear-gradient(90deg,#9ca3af_62%,#3b82f6_62%)] text-white border-blue-500",
  AZUL: "bg-blue-500 text-white border-blue-600",
  "AZUL/AMARELA": "bg-[linear-gradient(90deg,#3b82f6_62%,#facc15_62%)] text-white border-yellow-500 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]",
  AMARELA: "bg-yellow-400 text-black border-yellow-500",
  "AMARELA/LARANJA": "bg-[linear-gradient(90deg,#facc15_62%,#f97316_62%)] text-black border-orange-500",
  LARANJA: "bg-orange-500 text-white border-orange-600",
  VERDE: "bg-emerald-500 text-white border-emerald-600",
  ROXA: "bg-purple-600 text-white border-purple-700",
  MARROM: "bg-amber-800 text-white border-amber-900",
  PRETA: "bg-black text-white border-gray-800"
};

const BELT_ORDER = Object.values(BeltRank);

function getNextBelt(current: BeltRank): string {
  const idx = BELT_ORDER.indexOf(current);
  if (idx < BELT_ORDER.length - 1) return BELT_ORDER[idx + 1];
  return current;
}

export default function GraduacoesPage() {
  const { academy } = useAcademy();
  const {
    students,
    isLoading,
    approveStudentExam,
    revertStudentApproval,
    promoteStudent,
    promoteMultipleStudents,
    updateStudent,
    turmas,
  } = useApi(academy?.id);

  const [selectedTurma, setSelectedTurma] = useState<string>("all");
  const [activeView, setActiveView] = useState<"exame" | "aprovados">("exame");
  const [selectedTargetBelts, setSelectedTargetBelts] = useState<Record<string, BeltRank>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  if (!academy || isLoading) return null;

  const getTargetBelt = (student: Student): BeltRank =>
    selectedTargetBelts[student.id] ??
    student.pendingBeltRank ??
    (getNextBelt(student.beltRank) as BeltRank);

  // Tela 1: Somente alunos que ainda NÃO fizeram o exame (isReadyForExam === true e sem aprovação pendente)
  const aptosParaExame = students
    .filter(s => s.isReadyForExam === true && !s.pendingBeltRank)
    .filter(s => selectedTurma === "all" || s.turmaId === selectedTurma)
    .map(s => {
      const percentage = (s.classesAttendedToNextRank / s.classesTargetForNextRank) * 100;
      return { ...s, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // Tela 2: Alunos já aprovados no exame, aguardando a entrega da faixa para atualizar na Gestão e no App
  const aprovadosParaEntrega = students
    .filter(s => Boolean(s.pendingBeltRank))
    .filter(s => selectedTurma === "all" || s.turmaId === selectedTurma)
    .map(s => {
      const percentage = (s.classesAttendedToNextRank / s.classesTargetForNextRank) * 100;
      return { ...s, percentage };
    });

  // Passo 1: Aprovar no Exame (Tira do Painel de Exames e envia para a tela de Aprovados, SEM mudar a faixa ainda)
  const handleApproveExam = async (studentId: string, studentName: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const nextBelt = getTargetBelt(student);

    if (
      confirm(
        `Aprovar ${studentName} no exame para a Faixa ${nextBelt}?\n\n` +
        `🥋 Faixa Atual: ${student.beltRank}\n` +
        `🏆 Faixa Aprovada: ${nextBelt}\n\n` +
        `🔒 O aluno sairá desta fila de exames e irá para a tela de "Aprovados (Entrega de Faixa)".\n` +
        `A faixa ainda NÃO mudará na Gestão de Alunos nem no App do Aluno até o seu comando final.`
      )
    ) {
      setIsProcessing(true);
      try {
        await approveStudentExam(studentId, nextBelt);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Passo 2 (Individual): Entregar faixa e atualizar Gestão de Alunos + App do Aluno
  const handleDeliverBelt = async (studentId: string, studentName: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const finalBelt = getTargetBelt(student);

    if (
      confirm(
        `Confirmar entrega oficial da Faixa ${finalBelt} para ${studentName}?\n\n` +
        `✅ Isso atualizará IMEDIATAMENTE a faixa na tela de Gestão de Alunos e no App do Aluno!`
      )
    ) {
      setIsProcessing(true);
      try {
        await promoteStudent(studentId, finalBelt);
        alert(`Faixa ${finalBelt} liberada para ${studentName}! Gestão de Alunos e App atualizados. 🎉`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Passo 2 (Em Lote): Entregar faixas de TODOS os aprovados listados de uma só vez
  const handleDeliverAllBelts = async () => {
    if (aprovadosParaEntrega.length === 0) return;

    const resumo = aprovadosParaEntrega
      .map(s => `• ${s.name}: ${s.beltRank} → ${getTargetBelt(s)}`)
      .join("\n");

    if (
      confirm(
        `Liberar e atualizar as faixas de TODOS os ${aprovadosParaEntrega.length} alunos aprovados agora?\n\n` +
        `${resumo}\n\n` +
        `✅ Todos serão atualizados na Gestão de Alunos e no App do Aluno imediatamente!`
      )
    ) {
      setIsProcessing(true);
      try {
        await promoteMultipleStudents(
          aprovadosParaEntrega.map(s => ({
            studentId: s.id,
            newBelt: getTargetBelt(s),
          }))
        );
        alert(`Todas as ${aprovadosParaEntrega.length} graduações foram liberadas na Gestão de Alunos e no App! 🎉🥋`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Desfazer aprovação (devolver aluno para a fila de exames)
  const handleRevertToExam = async (studentId: string, studentName: string) => {
    if (confirm(`Devolver ${studentName} para a fila de alunos que ainda não fizeram exame?`)) {
      setIsProcessing(true);
      try {
        await revertStudentApproval(studentId);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      {/* Cabeçalho + Filtro de Turma */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Painel de Graduação
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeView === "exame"
              ? "Alunos que ainda não fizeram o exame. Ao aprovar aqui, eles vão para a tela de Aprovados sem mudar a faixa no app ainda."
              : "Alunos já aprovados no exame aguardando a entrega da faixa. Ao seu comando, a nova faixa será liberada na Gestão e no App."}
          </p>
        </div>

        <select
          value={selectedTurma}
          onChange={(e) => setSelectedTurma(e.target.value)}
          className="h-11 rounded-xl bg-card border border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground min-w-[200px] font-medium shadow-sm"
        >
          <option value="all">Fila Global (Todas as turmas)</option>
          {turmas.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Navegação entre as 2 Telas: Fila de Exame vs. Aprovados (Entrega de Faixa) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 p-1.5 rounded-2xl border border-border/50">
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveView("exame")}
            className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeView === "exame"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Fila de Exame (Pendentes)</span>
            <Badge
              variant="secondary"
              className={`ml-1 text-xs ${
                activeView === "exame"
                  ? "bg-white/20 text-white border-0"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {aptosParaExame.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("aprovados")}
            className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeView === "aprovados"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Aprovados (Entrega de Faixa)</span>
            <Badge
              variant="secondary"
              className={`ml-1 text-xs ${
                activeView === "aprovados"
                  ? "bg-white/20 text-white border-0"
                  : aprovadosParaEntrega.length > 0
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {aprovadosParaEntrega.length}
            </Badge>
          </button>
        </div>
      </div>

      {/* =========================================================
          TELA 1: FILA DE EXAME (ALUNOS QUE AINDA NÃO FIZERAM EXAME)
         ========================================================= */}
      {activeView === "exame" && (
        <>
          {aptosParaExame.length === 0 ? (
            <Card className="glass-card border-0 mt-6">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum aluno pendente de exame no momento
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Avalize um atleta manualmente na Gestão de Alunos para inseri-lo na fila de exames, ou confira a aba de{" "}
                  <button
                    type="button"
                    onClick={() => setActiveView("aprovados")}
                    className="text-emerald-400 font-semibold underline underline-offset-4 cursor-pointer"
                  >
                    Aprovados ({aprovadosParaEntrega.length})
                  </button>
                  .
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 mt-4">
              {aptosParaExame.map((student) => {
                const isFullyReady = student.percentage >= 100;
                const nextBelt = getTargetBelt(student);
                const wasManuallyApproved = student.isReadyForExam;

                return (
                  <Card
                    key={student.id}
                    className="glass-card border-0 overflow-hidden relative group transition-all hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${isFullyReady ? "bg-primary" : "bg-blue-400"}`} />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Info do Aluno */}
                        <div className="flex items-center gap-4">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt="Avatar"
                              className="h-14 w-14 rounded-full border-2 border-border object-cover"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                              {student.name.charAt(0)}
                            </div>
                          )}

                          <div>
                            <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`min-w-[110px] px-2.5 gap-1.5 justify-between uppercase text-[10px] tracking-wider font-semibold border ${
                                  BELT_COLORS[student.beltRank.toUpperCase()] || "bg-muted text-muted-foreground"
                                } flex items-center`}
                              >
                                <span>{student.beltRank}</span>
                                {(student.beltDegree || 0) > 0 && (
                                  <span className="flex items-center gap-[2px]">
                                    {Array.from({ length: student.beltDegree || 0 }).map((_, i) => (
                                      <span
                                        key={i}
                                        className={`inline-block w-[3px] h-3 rounded-full opacity-90 ${
                                          ["BRANCA", "PRETA"].includes(student.beltRank.toUpperCase())
                                            ? "bg-red-600"
                                            : "bg-white"
                                        }`}
                                      />
                                    ))}
                                  </span>
                                )}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <div className="relative inline-flex items-center">
                                <select
                                  aria-label={`Selecionar próxima faixa de ${student.name}`}
                                  title="Clique para alterar a faixa de destino"
                                  value={nextBelt}
                                  onChange={(e) =>
                                    setSelectedTargetBelts((prev) => ({
                                      ...prev,
                                      [student.id]: e.target.value as BeltRank,
                                    }))
                                  }
                                  className={`h-[22px] min-w-[145px] appearance-none cursor-pointer rounded-full border pl-2.5 pr-6 uppercase text-[10px] tracking-wider font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
                                    BELT_COLORS[nextBelt.toUpperCase()] || "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {BELT_ORDER.map((belt) => (
                                    <option
                                      key={belt}
                                      value={belt}
                                      className="bg-slate-900 text-white uppercase"
                                    >
                                      {formatBeltRank(belt)}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="h-3 w-3 pointer-events-none absolute right-2 opacity-80" />
                              </div>
                              {wasManuallyApproved && (
                                <Badge className="bg-blue-500 text-white text-[10px]">AVAL SENSEI</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progresso de Aulas */}
                        <div className="flex-1 w-full md:max-w-xs">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-foreground">
                              {student.classesAttendedToNextRank} / {student.classesTargetForNextRank} aulas
                            </span>
                            <span className={`font-bold ${isFullyReady ? "text-emerald-500" : "text-blue-500"}`}>
                              {student.percentage.toFixed(0)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(student.percentage, 100)}
                            className={`h-2.5 ${isFullyReady ? "[&>div]:bg-emerald-500" : "[&>div]:bg-blue-500"}`}
                          />
                        </div>

                        {/* Botão de Aprovar Exame */}
                        <div className="w-full md:w-auto flex justify-end">
                          <Button
                            disabled={isProcessing}
                            onClick={() => handleApproveExam(student.id, student.name)}
                            className="w-full md:w-auto rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Aprovar Graduação
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =========================================================
          TELA 2: APROVADOS (AGUARDANDO ENTREGA DE FAIXA / COMANDO)
         ========================================================= */}
      {activeView === "aprovados" && (
        <>
          {aprovadosParaEntrega.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Aguardando Cerimônia / Entrega de Faixa
                </p>
                <p className="text-xs text-muted-foreground">
                  Estes alunos já passaram no exame, mas <strong>ainda aparecem com a faixa antiga</strong> na Gestão de Alunos e no App do Aluno. Libere individualmente ou todos de uma vez abaixo.
                </p>
              </div>
              <Button
                disabled={isProcessing}
                onClick={handleDeliverAllBelts}
                className="w-full sm:w-auto shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25"
              >
                <Send className="h-4 w-4 mr-2" />
                Atualizar Todos na Gestão e App ({aprovadosParaEntrega.length})
              </Button>
            </div>
          )}

          {aprovadosParaEntrega.length === 0 ? (
            <Card className="glass-card border-0 mt-6">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum aluno aguardando entrega de faixa
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Quando você clicar em <strong>Aprovar Graduação</strong> na aba de Fila de Exame, os alunos aprovados ficarão guardados aqui até o momento de atualizar o sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 mt-4">
              {aprovadosParaEntrega.map((student) => {
                const approvedBelt = getTargetBelt(student);

                return (
                  <Card
                    key={student.id}
                    className="glass-card border-0 overflow-hidden relative group transition-all hover:shadow-lg hover:shadow-emerald-500/5"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Info do Aluno */}
                        <div className="flex items-center gap-4">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt="Avatar"
                              className="h-14 w-14 rounded-full border-2 border-emerald-500/40 object-cover"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-lg">
                              {student.name.charAt(0)}
                            </div>
                          )}

                          <div>
                            <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`min-w-[110px] px-2.5 gap-1.5 justify-between uppercase text-[10px] tracking-wider font-semibold border ${
                                  BELT_COLORS[student.beltRank.toUpperCase()] || "bg-muted text-muted-foreground"
                                } flex items-center`}
                              >
                                <span>{student.beltRank}</span>
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <div className="relative inline-flex items-center">
                                <select
                                  aria-label={`Alterar faixa aprovada de ${student.name}`}
                                  title="Clique caso queira ajustar a faixa aprovada antes da entrega"
                                  value={approvedBelt}
                                  onChange={async (e) => {
                                    const newBelt = e.target.value as BeltRank;
                                    setSelectedTargetBelts((prev) => ({
                                      ...prev,
                                      [student.id]: newBelt,
                                    }));
                                    await updateStudent(student.id, { pendingBeltRank: newBelt });
                                  }}
                                  className={`h-[22px] min-w-[145px] appearance-none cursor-pointer rounded-full border pl-2.5 pr-6 uppercase text-[10px] tracking-wider font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
                                    BELT_COLORS[approvedBelt.toUpperCase()] || "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {BELT_ORDER.map((belt) => (
                                    <option
                                      key={belt}
                                      value={belt}
                                      className="bg-slate-900 text-white uppercase"
                                    >
                                      {formatBeltRank(belt)}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="h-3 w-3 pointer-events-none absolute right-2 opacity-80" />
                              </div>
                              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                EXAME APROVADO
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Ações: Voltar p/ Exame ou Liberar Faixa Oficialmente */}
                        <div className="w-full md:w-auto flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleRevertToExam(student.id, student.name)}
                            className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
                            title="Devolver aluno para a fila de exames pendentes"
                          >
                            <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                            Voltar p/ Exame
                          </Button>

                          <Button
                            disabled={isProcessing}
                            onClick={() => handleDeliverBelt(student.id, student.name)}
                            className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Liberar na Gestão e App
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
