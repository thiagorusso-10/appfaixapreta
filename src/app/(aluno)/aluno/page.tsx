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
import { CheckCircle2, AlertTriangle, PlayCircle, MapPin, Trophy, Flame, Target, Swords, Copy, QrCode, Camera, X, Loader2 } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useState, useEffect, useRef } from "react";
import { StudentTechnique } from "@/lib/types";

export default function AlunoDashboard() {
  const { academy } = useAcademy();
  const { user } = useUser();
  const { students, payments, checkins, classes, turmas, plans, studentTechniques, recordCheckIn, isLoading } = useApi(academy?.id);
  const [selectedTech, setSelectedTech] = useState<StudentTechnique | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<'scanning' | 'processing' | 'success' | 'error'>('scanning');
  const [scannerMsg, setScannerMsg] = useState('');
  const scannerRef = useRef<any>(null);
  const scannerContainerId = 'qr-reader-container';

  // Inicializar/destruir o scanner QR
  useEffect(() => {
    if (!showQrScanner) {
      // Limpar scanner ao fechar
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch (e) {}
        scannerRef.current = null;
      }
      return;
    }

    // Esperar o DOM montar o container
    const timer = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode(scannerContainerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            // QR lido! Parar scanner e processar
            try { await scanner.stop(); } catch (e) {}
            setScannerStatus('processing');

            // Verificar se a URL do QR contém /checkin/
            if (decodedText.includes('/checkin/')) {
              // Navegar para a página de checkin
              window.location.href = decodedText;
            } else {
              setScannerStatus('error');
              setScannerMsg('QR Code inválido. Use o QR Code da academia.');
              setTimeout(() => {
                setScannerStatus('scanning');
                setScannerMsg('');
                // Reiniciar scanner
                try {
                  scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    () => {},
                    () => {}
                  );
                } catch (e) {}
              }, 2500);
            }
          },
          () => {} // erro de scan silencioso (normal enquanto aponta)
        );
      } catch (err: any) {
        console.error('Erro ao iniciar câmera:', err);
        setScannerStatus('error');
        setScannerMsg('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, [showQrScanner]);

  const closeScanner = () => {
    setShowQrScanner(false);
    setScannerStatus('scanning');
    setScannerMsg('');
  };

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
  const myBeltColor = BELT_COLORS[student.beltRank?.toUpperCase()] || '#3B82F6';

  const BELT_ORDER = ['BRANCA', 'CINZA', 'AZUL', 'AMARELA', 'LARANJA', 'VERDE', 'ROXA', 'MARROM', 'PRETA'];
  const currentBeltIndex = BELT_ORDER.indexOf(student.beltRank?.toUpperCase() || 'BRANCA');
  const nextBeltRank = currentBeltIndex !== -1 && currentBeltIndex < BELT_ORDER.length - 1 
    ? BELT_ORDER[currentBeltIndex + 1] 
    : student.beltRank;
  const nextBeltColor = BELT_COLORS[nextBeltRank] || '#3B82F6';

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
         onClick={() => setShowQrScanner(true)}
      >
         <Camera className="mr-2 h-6 w-6" /> 
         Escanear QR Code do Treino
      </Button>

      {/* Modal Scanner QR */}
      {showQrScanner && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-3xl overflow-hidden shadow-2xl border border-border/50">
            {/* Header do Scanner */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Escanear QR Code</span>
              </div>
              <button onClick={closeScanner} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Área da câmera */}
            <div className="relative bg-black aspect-square">
              {scannerStatus === 'scanning' && (
                <div id={scannerContainerId} className="w-full h-full" />
              )}
              {scannerStatus === 'processing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-white font-semibold">Registrando presença...</p>
                </div>
              )}
              {scannerStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6">
                  <AlertTriangle className="h-12 w-12 text-amber-400" />
                  <p className="text-white font-semibold text-center text-sm">{scannerMsg}</p>
                </div>
              )}
            </div>

            {/* Instrução */}
            <div className="px-5 py-4 text-center">
              <p className="text-sm text-muted-foreground">Aponte a câmera para o <strong>QR Code da academia</strong></p>
            </div>
          </div>
        </div>
      )}

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

      {/* Progress Card - Ultra Gamified */}
      <Card 
        className="glass-card border-0 overflow-hidden relative shadow-lg transition-transform hover:scale-[1.01] duration-300"
        style={{
          background: `linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 40%, ${nextBeltColor}15 100%)`,
        }}
      >
         <div 
           className="absolute top-0 left-0 w-full h-1.5" 
           style={{ background: `linear-gradient(90deg, ${myBeltColor}, ${nextBeltColor})` }}
         />
         
         <CardHeader className="pb-3 pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 font-black tracking-tight">
                  <Target className="h-5 w-5" style={{ color: nextBeltColor }} />
                  Próxima Faixa
                </CardTitle>
                <CardDescription className="font-medium mt-1">Rumo à faixa <strong style={{ color: nextBeltColor }}>{nextBeltRank}</strong></CardDescription>
              </div>
              <div 
                className="flex items-center gap-1.5 px-4 py-2 rounded-full shadow-sm border"
                style={{ backgroundColor: `${nextBeltColor}15`, borderColor: `${nextBeltColor}30` }}
              >
                <Trophy className="h-4 w-4" style={{ color: nextBeltColor }} />
                <span className="text-sm font-bold" style={{ color: nextBeltColor }}>{Math.round(progressValue)}%</span>
              </div>
            </div>
         </CardHeader>
         <CardContent className="relative z-10 pb-6">
            
            {/* Visual da Faixa Atual */}
            <div className="mb-6 flex flex-col gap-2">
               <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sua Faixa Atual</span>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: myBeltColor }}>{student.beltRank}</span>
               </div>
               
               {/* Faixa Realista (Textura de Tecido e Costuras) */}
               <div 
                 className="relative h-11 w-full rounded-sm shadow-md overflow-hidden flex items-center border-y-2 border-x border-black/20 group" 
                 style={{ backgroundColor: myBeltColor }}
               >
                  {/* Costuras Longitudinais (Stitching) */}
                  <div className="absolute inset-0 flex flex-col justify-evenly py-0.5 opacity-30 mix-blend-multiply pointer-events-none">
                    <div className="w-full h-[1px] border-b-2 border-dashed border-black/40"></div>
                    <div className="w-full h-[1px] border-b-2 border-dashed border-black/40"></div>
                    <div className="w-full h-[1px] border-b-2 border-dashed border-black/40"></div>
                    <div className="w-full h-[1px] border-b-2 border-dashed border-black/40"></div>
                    <div className="w-full h-[1px] border-b-2 border-dashed border-black/40"></div>
                    <div className="w-full h-[1px] border-b-2 border-dashed border-black/40"></div>
                  </div>
                  
                  {/* Efeito de Volume (Sombra e Luz) */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/30 mix-blend-overlay pointer-events-none"></div>

                  {/* Etiqueta na Faixa (Nome da Faixa) */}
                  <div className="absolute left-3 bg-black/80 px-2 py-1 rounded-sm border border-black z-10 shadow-sm flex items-center justify-center">
                    <span className="text-[10px] font-black tracking-widest uppercase text-white/90">{student.beltRank}</span>
                  </div>
                  
                  {/* Graus diretos na Faixa */}
                  <div className="absolute right-3 top-0 h-full flex items-center justify-end gap-1.5 z-20">
                     {Array.from({ length: student.beltDegree || 0 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="h-full w-2.5 shadow-sm border-x border-black/20" 
                          style={{ backgroundColor: ['BRANCA', 'PRETA'].includes(student.beltRank.toUpperCase()) ? '#DC2626' : '#FFFFFF' }}
                        />
                     ))}
                  </div>
               </div>
            </div>

            {/* Barra de Progresso Redesenhada */}
            <div className="space-y-2 mb-2">
              <div className="flex justify-between text-sm font-black">
                 <span className="text-foreground/70">Treinos Concluídos</span>
                 <span>
                    <span style={{ color: myBeltColor }}>{classesAttended}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span style={{ color: nextBeltColor }}>{classesTarget}</span>
                 </span>
              </div>
              <div className="relative h-4 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner border border-border/40">
                <div 
                  className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${Math.min(100, progressValue)}%`, 
                    background: `linear-gradient(90deg, ${myBeltColor}, ${nextBeltColor})` 
                  }}
                />
              </div>
            </div>
            
            {/* Call to Action ou Alerta de Exame */}
            {isApto ? (
               <div className="mt-5 flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                  <Trophy className="h-6 w-6 text-emerald-600 drop-shadow-md animate-bounce" />
                  <p className="text-sm font-black text-emerald-700 uppercase tracking-widest relative z-10">
                    APTO PARA O EXAME! 🥋
                  </p>
               </div>
            ) : (
               <div className="mt-5 flex items-center justify-center gap-2 p-3 bg-card border border-border/50 rounded-xl shadow-sm">
                 <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
                 <p className="text-sm font-semibold text-foreground">
                   Faltam <span className="font-black text-lg px-1" style={{ color: nextBeltColor }}>{remainingClasses}</span> presenças para o exame!
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
