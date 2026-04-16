"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { type Student, BeltRank } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

const BELT_COLORS: Record<string, string> = {
  BRANCA: "bg-white text-black border-gray-300",
  CINZA: "bg-gray-400 text-white border-gray-500",
  AZUL: "bg-blue-500 text-white border-blue-600",
  AMARELA: "bg-yellow-400 text-black border-yellow-500",
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
  const { students, isLoading, promoteStudent, turmas } = useApi(academy?.id);
  const [selectedTurma, setSelectedTurma] = useState<string>("all");

  if (!academy || isLoading) return null;

  // Filtrar: Somente alunos que receberam o AVAL MANUAL do Sensei/Gestor e pertencem a turma filtrada
  const aptosParaExame = students
    .filter(s => s.isReadyForExam === true)
    .filter(s => selectedTurma === "all" || s.turmaId === selectedTurma)
    .map(s => {
      const percentage = (s.classesAttendedToNextRank / s.classesTargetForNextRank) * 100;
      return { ...s, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const handleApproveGraduation = async (studentId: string, studentName: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const nextBelt = getNextBelt(student.beltRank);

    if (confirm(`Aprovar graduação de ${studentName}?\n\n🥋 Faixa Atual: ${student.beltRank}\n🏆 Nova Faixa: ${nextBelt}\n\nAs aulas concluídas NÃO serão zeradas.`)) {
      // O Supabase tem uma trigger/history log? 
      // Por enquanto chamamos o hook promoteStudent que já fará inserção no history e update no student
      await promoteStudent(studentId, nextBelt as BeltRank);
      
      alert(`${studentName} promovido(a) para Faixa ${nextBelt} com sucesso! 🎉`);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Painel de Graduação
          </h1>
          <p className="text-muted-foreground mt-1">
            Alunos aptos para exame de faixa. Avalize alunos na aba Gestão de Alunos ou aguarde eles completarem as horas de tatame.
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

      {aptosParaExame.length === 0 ? (
        <Card className="glass-card border-0 mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">A fila está vazia no momento</h3>
            <p className="text-sm text-muted-foreground">
              Avance horas de tatame ou avalize um atleta manualmente na Gestão de Alunos para inseri-lo na pauta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 mt-6">
          {aptosParaExame.map((student) => {
            const isFullyReady = student.percentage >= 100;
            const nextBelt = getNextBelt(student.beltRank);
            const wasManuallyApproved = student.isReadyForExam;

            return (
              <Card key={student.id} className="glass-card border-0 overflow-hidden relative group transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isFullyReady ? 'bg-primary' : 'bg-blue-400'}`} />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    
                    {/* Info do Aluno */}
                    <div className="flex items-center gap-4">
                      {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt="Avatar" className="h-14 w-14 rounded-full border-2 border-border object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className={`w-[110px] justify-between uppercase text-[10px] tracking-wider font-semibold border ${BELT_COLORS[student.beltRank.toUpperCase()] || 'bg-muted text-muted-foreground'} flex items-center`}>
                            <span>{student.beltRank}</span>
                            {(student.beltDegree || 0) > 0 && (
                              <span className="flex items-center gap-[2px]">
                                {Array.from({ length: student.beltDegree || 0 }).map((_, i) => (
                                  <span key={i} className={`inline-block w-[3px] h-3 rounded-full opacity-90 ${
                                    ['BRANCA', 'PRETA'].includes(student.beltRank.toUpperCase()) ? 'bg-red-600' : 'bg-white'
                                  }`} />
                                ))}
                              </span>
                            )}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className={`w-[110px] justify-between uppercase text-[10px] tracking-wider font-semibold border ${BELT_COLORS[nextBelt.toUpperCase()] || 'bg-muted text-muted-foreground'} flex items-center`}>
                            <span>{nextBelt}</span>
                          </Badge>
                          {wasManuallyApproved && (
                            <Badge className="bg-blue-500 text-white text-[10px]">AVAL SENSEI</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progresso de Aulas */}
                    <div className="flex-1 w-full md:max-w-xs">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-foreground">{student.classesAttendedToNextRank} / {student.classesTargetForNextRank} aulas</span>
                        <span className={`font-bold ${isFullyReady ? 'text-emerald-500' : 'text-blue-500'}`}>
                          {student.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={Math.min(student.percentage, 100)} className={`h-2.5 ${isFullyReady ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-500'}`} />
                    </div>

                    {/* Botão de Ação */}
                    <div className="w-full md:w-auto flex justify-end">
                      <Button 
                        onClick={() => handleApproveGraduation(student.id, student.name)}
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
    </div>
  );
}
