"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Printer, UserCheck, AlertTriangle, CheckCircle2, Clock, Users, CalendarDays, Info, Trash2 } from "lucide-react";
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

interface CheckInEntry {
  id: string;
  studentId: string;
  studentName: string;
  beltRank: string;
  beltDegree?: number;
  time: string;
  warning?: string;
  avatarUrl?: string;
}

export default function CheckinQrPage() {
  const { academy } = useAcademy();
  const { students, checkins, recordCheckIn, deleteCheckIn, isLoading, turmas } = useApi(academy?.id);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTurma, setSelectedTurma] = useState("all");
  const [isDeleting, setIsDeleting] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [feed, setFeed] = useState<CheckInEntry[]>([]);

  useEffect(() => {
    if (students && students.length > 0) {
       const filteredStudents = students
         .filter(s => s.status === "ATIVO" || s.status === "INATIVO")
         .filter(s => selectedTurma === "all" || s.turmaId === selectedTurma);
       if (filteredStudents.length > 0) {
         setSelectedStudentId(filteredStudents[0].id);
       } else {
         setSelectedStudentId("");
       }
    }
  }, [students, selectedTurma]);

  // Sync feed realtime com banco e com a data do seletor
  useEffect(() => {
    if (!students || students.length === 0) return;
    const mapped = checkins
      .filter(c => {
        // Traz apenas baseando na Data escolhida no topo da tela
        const cDate = new Date(c.timestamp).toLocaleDateString('en-CA');
        return cDate === selectedDate;
      })
      .map(c => {
        const student = students.find(s => s.id === c.studentId);
        return {
          id: c.id,
          studentId: student?.id || '',
          turmaId: student?.turmaId || '',
          studentName: student?.name || 'Desconhecido',
          beltRank: student?.beltRank || 'BRANCA',
          beltDegree: student?.beltDegree || 0,
          time: new Date(c.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          warning: student?.checkinBlocked ? 'Bloqueado: ' + student.checkinBlockReason : undefined,
          avatarUrl: student?.avatarUrl
        };
      })
      .filter(c => selectedTurma === "all" || c.turmaId === selectedTurma);
    setFeed(mapped.reverse());
  }, [checkins, students, selectedDate, selectedTurma]);

  if (!academy || isLoading) return null;

  const handleCheckIn = async () => {
    if (!selectedStudentId) return;
    
    // Verificações locais basicas
    const student = students.find(s => s.id === selectedStudentId);

    try {
      const result = await recordCheckIn(selectedStudentId, selectedDate);
      if (result?.error) {
        alert(`⚠️ ${result.error}`);
      }
      // O useEffect sync vai atualizar o feed assim que a mutation terminar
    } catch (err: any) {
      alert("Erro ao registrar: " + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <QrCode className="h-8 w-8 text-primary" />
          Check-in Inteligente
        </h1>
        <p className="text-muted-foreground mt-1">
          Disponibilize o QR Code na recepção e acompanhe as presenças em tempo real.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Coluna Esquerda: QR Code + Simulador */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card className="glass-card border-0 shadow-xl overflow-hidden flex flex-col items-center text-center">
            <div className="w-full bg-primary/5 py-3 border-b border-primary/10">
              <h3 className="font-bold text-primary tracking-widest uppercase text-sm">Escaneie para Check-in</h3>
            </div>
            <CardContent className="pt-6 pb-6 flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-border mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://app.faixapreta.com/checkin/${academy.id}`} 
                  alt="QR Code Check-in" 
                  className="h-44 w-44 object-contain"
                />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{academy.name}</h2>
              <p className="text-muted-foreground text-xs max-w-[250px]">
                Aponte a câmera do celular para registrar presença instantaneamente.
              </p>
              <Button variant="outline" className="mt-4 rounded-xl w-full text-xs">
                <Printer className="h-3.5 w-3.5 mr-2" /> Imprimir Cartaz
              </Button>
            </CardContent>
          </Card>

          {/* Simulador de Check-in (para testes sem QR real) */}
          <Card className="glass-card border-0 bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Simulador de Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Selecione um aluno para simular a leitura do QR Code na recepção:</p>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                {students
                  .filter(s => s.status === "ATIVO" || s.status === "INATIVO")
                  .filter(s => selectedTurma === "all" || s.turmaId === selectedTurma)
                  .map(s => {
                  const alreadyCheckedIn = checkins.some(c => {
                    const checkinDate = new Date(c.timestamp);
                    const today = new Date();
                    return c.studentId === s.id 
                      && checkinDate.getDate() === today.getDate()
                      && checkinDate.getMonth() === today.getMonth()
                      && checkinDate.getFullYear() === today.getFullYear();
                  });
                  return (
                    <option key={s.id} value={s.id}>
                      {alreadyCheckedIn ? "✅ " : ""}{s.name} — Faixa {s.beltRank}
                    </option>
                  );
                })}
              </select>
              <Button className="w-full rounded-xl shadow-lg shadow-primary/20" onClick={handleCheckIn}>
                <QrCode className="h-4 w-4 mr-2" /> Registrar Presença
              </Button>
              <div className="flex items-start gap-2 mt-4 bg-amber-500/10 rounded-lg p-2.5 text-xs text-amber-700 border border-amber-500/20">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Inadimplência:</strong> O check-in funcionará, mas o feed alertará caso o aluno esteja bloqueado para comunicar a secretaria.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Feed de Presenças */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Histórico de Presenças
            </h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedTurma}
                onChange={(e) => setSelectedTurma(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">Todas as turmas</option>
                {turmas.map(t => (
                   <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-8 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 px-3 py-1 text-sm font-semibold whitespace-nowrap">
                {feed.length} Total
              </Badge>
              {feed.filter(f => f.warning).length > 0 && (
                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0 px-3 py-1 text-sm font-semibold whitespace-nowrap">
                  {feed.filter(f => f.warning).length} Bloqueados
                </Badge>
              )}
            </div>
          </div>

          {feed.length === 0 ? (
            <Card className="glass-card border-0 mt-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <QrCode className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Nenhum check-in ainda</h3>
                <p className="text-sm text-muted-foreground">Quando os alunos escanearem o QR, as presenças aparecerão aqui ao vivo.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {feed.map((entry, idx) => (
                <Card key={entry.id} className={`border-0 overflow-hidden relative transition-all animate-in fade-in slide-in-from-right-4 duration-300 ${entry.warning ? 'bg-amber-500/5 ring-1 ring-amber-500/30' : 'glass-card'}`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${entry.warning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt="" className="h-10 w-10 rounded-full border-2 border-border object-cover" />
                      ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${entry.warning ? 'bg-amber-500/20 text-amber-700' : 'bg-emerald-500/20 text-emerald-700'}`}>
                          {entry.studentName.charAt(0)}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{entry.studentName}</span>
                          <Badge variant="outline" className={`w-[110px] justify-between text-[9px] uppercase tracking-wider font-semibold border ${BELT_COLORS[entry.beltRank.toUpperCase()] || 'bg-muted'} flex items-center`}>
                            <span>{entry.beltRank}</span>
                            {(entry.beltDegree || 0) > 0 && (
                              <span className="flex items-center gap-[2px]">
                                {Array.from({ length: entry.beltDegree || 0 }).map((_, i) => (
                                  <span key={i} className={`inline-block w-[3px] h-2.5 rounded-full opacity-90 ${
                                    ['BRANCA', 'PRETA'].includes(entry.beltRank.toUpperCase()) ? 'bg-red-600' : 'bg-white'
                                  }`} />
                                ))}
                              </span>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {entry.time}
                          </span>
                          {entry.warning ? (
                            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Pendência Financeira
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Em dia
                            </span>
                          )}
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8 ml-2"
                        disabled={isDeleting === entry.id}
                        onClick={async () => {
                          if (confirm(`Tem certeza que deseja remover o check-in de ${entry.studentName}? A presença será descontada.`)) {
                            setIsDeleting(entry.id);
                            await deleteCheckIn(entry.id, entry.studentId);
                            setIsDeleting("");
                          }
                        }}
                      >
                         <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {entry.warning && (
                      <div className="mt-2 bg-amber-500/10 rounded-lg p-2 text-xs text-amber-700 border border-amber-500/20">
                        {entry.warning}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
