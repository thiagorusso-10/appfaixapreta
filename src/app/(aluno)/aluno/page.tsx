"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { BeltRank } from "@/lib/types";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, AlertTriangle, PlayCircle, MapPin, Trophy, Flame, Target, Swords, Copy } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useState } from "react";
import { StudentTechnique } from "@/lib/types";

export default function AlunoDashboard() {
  const { academy } = useAcademy();
  const { user } = useUser();
  const { students, payments, checkins, classes, turmas, plans, studentTechniques, recordCheckIn, isLoading } = useApi(academy?.id);
  const [selectedTech, setSelectedTech] = useState<StudentTechnique | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  if (!academy || isLoading) return null;

  // Encontra o perfil do aluno no array consumido em tempo real mapeando pelo email
  const student = user?.primaryEmailAddress?.emailAddress 
    ? students.find(s => s.email === user.primaryEmailAddress!.emailAddress) || students[0]
    : students.length > 0 ? students[0] : null;
  if (!student) return <div className="p-4">Aluno não encontrado no banco de dados.</div>;

  const myPayments = payments.filter(p => p.studentId === student.id);
  const hasDelayedPayment = myPayments.some(p => p.status === "ATRASADO");
  
  const classesAttended = student.classesAttendedToNextRank || 0;
  const classesTarget = student.classesTargetForNextRank || 30;
  
  const progressValue = (classesAttended / classesTarget) * 100;
  const remainingClasses = classesTarget - classesAttended;
  const isApto = progressValue >= 100 || student.isReadyForExam;
  
  const myTurma = student.turmaId ? turmas.find(t => t.id === student.turmaId) : null;
  const myPlan = student.planId ? plans.find(p => p.id === student.planId) : null;
  
  // Histórico de aulas no banco
  const myCheckins = checkins.filter(c => c.studentId === student.id);
  
  // Técnicas Aprendidas
  const myTechniques = studentTechniques
    .filter(t => t.studentId === student.id)
    .sort((a, b) => new Date(b.learnedAt).getTime() - new Date(a.learnedAt).getTime())
    .slice(0, 5);

  // Calcula Streak Real baseado nos checkins
  const calculateStreak = () => {
     if (myCheckins.length === 0) return 0;
     
     // Remove horas para comparar penas os dias de treino
     const dates = myCheckins.map(c => new Date(c.timestamp).setHours(0,0,0,0));
     // Seta de dias únicos de treino, ordenada do mais recente pro mais antigo
     const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);
     
     let streak = 0;
     let todayIsChecked = false;
     const todayMs = new Date().setHours(0,0,0,0);
     
     if (uniqueDates[0] === todayMs) {
        todayIsChecked = true;
     }

     const maxGapToNotBreakStreak = 1000 * 60 * 60 * 24 * 7; // Tolerancia de 7 dias entre um treino e outro para não quebrar (exemplo)
     
     // Para ser mais simples: Conta quantos treinos seguidos o aluno fez respeitando uma janela (ex: no máximo 5 dias desde o último treino)
     // Uma forma melhor de fazer gamificação por presença é usar a contagem direta da sequência linear nos "dias de treino da turma".
     // Como não temos a grade fixa estrita para punir, o Streak aqui contaremos apenas o número total de checkins no mês atual. (Variante de adaptação)
     
     // GAMIFICAÇÃO: "Treinos Consecutivos (sem dar salto longo de ausência)"
     let currentStreak = 1;
     for (let i = 0; i < uniqueDates.length - 1; i++) {
        const diff = uniqueDates[i] - uniqueDates[i+1];
        if (diff <= maxGapToNotBreakStreak) {
           currentStreak++;
        } else {
           break; // Perdeu a ofensiva se sumiu mais de X dias
        }
     }
     
     return currentStreak;
  };

  const checkInStreak = calculateStreak();

  const BELT_COLORS: Record<string, string> = {
    'BRANCA': '#FFFFFF',
    'CINZA': '#9CA3AF',
    'AZUL': '#3B82F6',
    'AMARELA': '#EAB308',
    'LARANJA': '#F97316',
    'VERDE': '#22C55E',
    'ROXA': '#8B5CF6',
    'MARROM': '#92400E',
    'PRETA': '#1F2937',
  };
  const myBeltColor = BELT_COLORS[student.beltRank] || '#3B82F6';

  return (
    <div className="space-y-6 animate-slide-up pb-8 max-w-lg mx-auto">
      
      {/* Welcome Header - Premium */}
      <div className="glass-card rounded-2xl p-5 flex items-center gap-4 relative">
         <div className="absolute top-4 right-4 z-10">
            <NotificationBell />
         </div>
         {student.avatarUrl ? (
            <img src={student.avatarUrl} alt={student.name} className="h-16 w-16 rounded-2xl border-2 border-primary/30 object-cover shadow-md" />
         ) : (
            <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold shadow-md">
               {student.name.charAt(0)}
            </div>
         )}
         <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Olá, {student.name.split(' ')[0]}!</h1>
            <p className="text-sm text-muted-foreground">{student.modality} • Faixa {student.beltRank}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {myPlan && <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] border-none">{myPlan.name}</Badge>}
              {myTurma && <Badge variant="secondary" className="bg-foreground/5 text-foreground/70 hover:bg-foreground/10 text-[10px] border-none">{myTurma.name}</Badge>}
            </div>
         </div>
         {/* Streak Badge */}
         <div className="flex flex-col items-center">
           <div className="h-12 w-12 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
             <Flame className="h-6 w-6 text-white" />
           </div>
           <span className="text-[10px] font-bold text-amber-600 mt-1">{checkInStreak} treinos</span>
         </div>
      </div>

      {/* CTA GIGANTE - Check-in */}
      <Button 
         size="lg" 
         className={`w-full h-16 text-lg font-bold rounded-2xl shadow-lg transition-all duration-300 shadow-primary/25 bg-linear-to-r from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01]`}
         onClick={async () => {
           try {
             const result = await recordCheckIn(student.id);
             if (result?.error) {
               alert(`⚠️ ${result.error}`);
               return;
             }
             alert("✅ Check-in realizado com sucesso! Bom treino! 🥋");
           } catch (err: any) {
             alert(err.message);
           }
         }}
      >
         <MapPin className="mr-2 h-6 w-6" /> 
         Fazer Check-in no Treino
      </Button>

      {/* Financial Alert */}
      {hasDelayedPayment ? (
         <div className="glass-card rounded-2xl p-4 flex items-start gap-3 border-red-500/20 bg-red-500/5">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
               <h4 className="font-semibold text-destructive">Mensalidade Pendente</h4>
               <p className="text-sm text-destructive/80 mt-0.5">Verificamos um atraso em seu plano.</p>
               <Button
                 variant="destructive"
                 size="sm"
                 className="mt-3 rounded-xl"
                 onClick={() => setShowPixModal(true)}
               >
                 Regularizar Agora
               </Button>
            </div>
         </div>
      ) : (
         <div className="glass-card rounded-2xl p-4 flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700 text-sm">Plano em dia!</p>
              <p className="text-xs text-emerald-600/70">Sua matrícula está ativa e regular.</p>
            </div>
         </div>
      )}

      {/* Progress Card - Gamified */}
      <Card className="glass-card border-0 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-primary/80 to-primary/50" />
         <CardHeader className="pb-2 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Próxima Graduação
                </CardTitle>
                <CardDescription>Rumo à nova faixa</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{Math.round(progressValue)}%</span>
              </div>
            </div>
         </CardHeader>
         <CardContent>
            <div className="flex justify-between text-sm mb-3 font-medium">
               <span className="text-foreground flex items-center gap-1.5">
                 <div className="h-3 w-6 rounded-sm shadow-sm border border-border/20" style={{ backgroundColor: myBeltColor }} />
                 Faixa {student.beltRank}
               </span>
               <span className="text-primary font-bold">{classesAttended} / {classesTarget}</span>
            </div>
            <div className="relative">
              <Progress value={progressValue} className="h-4 rounded-full" />
            </div>
            
            {isApto ? (
               <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-linear-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                  <Trophy className="h-5 w-5 text-emerald-600 drop-shadow-md" />
                  <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider relative z-10">
                    APTO PARA O EXAME
                  </p>
               </div>
            ) : (
               <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-secondary/50 rounded-xl">
                 <Flame className="h-4 w-4 text-amber-500" />
                 <p className="text-sm font-medium text-foreground">
                   Faltam <span className="text-primary font-bold">{remainingClasses}</span> presenças para o exame!
                 </p>
               </div>
            )}
         </CardContent>
      </Card>

      {/* Techniques History */}
      <div>
         <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
           <PlayCircle className="h-4 w-4 text-primary" />
           Técnicas Aprendidas
         </h3>
         <div className="space-y-2.5">
            {myTechniques.length > 0 ? (
               myTechniques.map((tech) => (
                   <div 
                     key={tech.id} 
                     className="glass-card rounded-xl p-4 flex items-center border-0 gap-3 cursor-pointer hover:bg-secondary/30 transition-colors active:scale-[0.98]"
                     onClick={() => setSelectedTech(tech)}
                   >
                      {tech.imageUrl && (
                         <img src={tech.imageUrl} alt={tech.name} className="h-12 w-12 rounded-lg object-cover bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between flex-wrap gap-1 mb-0.5">
                            <p className="font-bold text-foreground text-sm truncate">{tech.name}</p>
                            <p className="text-xs text-muted-foreground shrink-0">{new Date(tech.learnedAt).toLocaleDateString('pt-BR')}</p>
                         </div>
                         {tech.category && (
                            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none">{tech.category}</Badge>
                         )}
                         {tech.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{tech.notes}</p>
                         )}
                      </div>
                   </div>
               ))
            ) : (
               <div className="glass-card rounded-xl p-6 text-center border-0">
                 <p className="text-sm text-muted-foreground font-medium">Nenhum golpe na sua biblioteca.</p>
                 <p className="text-xs text-muted-foreground mt-1">Seu professor adicionará as técnicas que você aprender! 🥋</p>
               </div>
            )}
         </div>
      </div>

      {/* Modal de visualização da técnica */}
      <Dialog open={!!selectedTech} onOpenChange={(o) => !o && setSelectedTech(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 rounded-2xl">
          {selectedTech && (
            <div>
              {selectedTech.imageUrl ? (
                <img src={selectedTech.imageUrl} alt={selectedTech.name} className="w-full max-h-[60vh] object-contain bg-black/90" />
              ) : (
                <div className="h-48 w-full bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Swords className="h-16 w-16 text-primary/20" />
                </div>
              )}
              <div className="p-5 space-y-2">
                <h3 className="text-xl font-bold text-foreground">{selectedTech.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTech.category && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">{selectedTech.category}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(selectedTech.learnedAt).toLocaleDateString('pt-BR')}</span>
                </div>
                {selectedTech.notes && (
                  <p className="text-sm text-muted-foreground pt-2 border-t border-border/50 mt-3">
                    <span className="font-medium text-foreground">Dica do professor:</span> {selectedTech.notes}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal PIX - Regularização */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="sm:max-w-[400px] border-border/50 shadow-2xl rounded-2xl">
          <div className="py-2 space-y-4">
            <div className="text-center space-y-1">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-lg font-bold">Regularizar Mensalidade</h2>
              <p className="text-sm text-muted-foreground">Realize o pagamento via PIX para liberar seu acesso completo.</p>
            </div>

            {academy?.pixKey ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground text-center">Chave PIX da Academia</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-secondary text-secondary-foreground p-3 rounded-xl border border-border/50 font-mono text-sm break-all flex items-center">
                    {academy.pixKey}
                  </div>
                  <Button
                    size="icon"
                    className="h-auto w-12 rounded-xl shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(academy!.pixKey!);
                      setPixCopied(true);
                      setTimeout(() => setPixCopied(false), 2000);
                    }}
                  >
                    {pixCopied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Após realizar o PIX, aguarde a confirmação do seu professor.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-sm text-center">
                A academia ainda não configurou a chave PIX. Por favor, solicite-a diretamente na recepção.
              </div>
            )}

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setShowPixModal(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
