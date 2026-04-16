"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { apiMock } from "@/lib/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Clock, MapPin, Users, CheckCircle, Activity, FileText } from "lucide-react";
import { useState } from "react";

export default function ProfessorDashboardPage() {
  const { academy } = useAcademy();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  if (!academy) return null;

  // Pegar turmas que ocorrem "hoje" (mock usando Seg, Ter...)
  const todaysClasses = apiMock.getClassesByAcademy(academy.id);
  const students = apiMock.getStudentsByAcademy(academy.id);

  // Simulação de marcação de presença em memória state local 
  const [attendance, setAttendance] = useState<Record<string, Record<string, boolean>>>({});

  const toggleAttendance = (classId: string, studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [classId]: {
         ...(prev[classId] || {}),
         [studentId]: !(prev[classId]?.[studentId])
      }
    }));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Minhas Aulas (Hoje)</h1>
        <p className="text-sm text-muted-foreground mt-1">Selecione uma turma para realizar a chamada e ver as técnicas.</p>
      </div>

      <div className="grid gap-4">
        {todaysClasses.map(session => (
          <Sheet key={session.id}>
            <SheetTrigger>
              <Card className="glass-card border-0 relative overflow-hidden group hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-primary to-primary/50" />
                <CardContent className="p-5 flex justify-between items-center">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">{session.time}</Badge>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{session.modality}</span>
                     </div>
                     <h3 className="font-bold text-foreground text-lg">{session.level}</h3>
                     <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Tatame {Math.floor(Math.random() * 3) + 1}
                     </p>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     <span className="flex items-center gap-1.5 text-sm font-medium bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {Math.floor(Math.random() * 15) + 5} Alunos
                     </span>
                     <Button size="sm" variant="ghost" className="h-8 text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground rounded-lg transition-colors">
                        Fazer Chamada
                     </Button>
                   </div>
                </CardContent>
              </Card>
            </SheetTrigger>
            
            {/* SHEET DE CHAMADA DA TURMA */}
            <SheetContent side="bottom" className="h-[90vh] sm:h-screen sm:side-right sm:max-w-md w-full rounded-t-3xl sm:rounded-none p-0 border-t-0 shadow-2xl glass-sidebar overflow-hidden flex flex-col">
               <SheetHeader className="p-5 bg-card border-b border-border shadow-sm pb-4 sticky top-0 z-10 shrink-0">
                  <div className="flex items-start justify-between">
                     <div>
                        <SheetTitle className="text-left text-xl leading-tight">Chamada: {session.modality}</SheetTitle>
                        <SheetDescription className="text-left mt-0.5">{session.level} • {session.time}</SheetDescription>
                     </div>
                  </div>
                  
                  {/* Técnica do Dia Card (Professor vê o que vai ensinar) */}
                  <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3 relative overflow-hidden">
                     <div className="absolute right-0 bottom-0 opacity-10 blur-xl w-16 h-16 bg-primary rounded-full" />
                     <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-4 w-4 text-primary" />
                     </div>
                     <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Técnica do Dia</p>
                        <p className="text-sm font-medium text-foreground mt-0.5 leading-tight">{session.techniqueOfTheDayId === 't1' ? 'Armlock da Guarda Fechada' : 'Passagem de Guarda Toreando'}</p>
                     </div>
                  </div>
               </SheetHeader>
               
               {/* Lits of Students for Check-in */}
               <div className="flex-1 overflow-y-auto w-full p-4 pb-20">
                  <h4 className="font-semibold text-sm mb-3">Lista de Presença</h4>
                  <div className="space-y-3">
                     {students.map(student => {
                        const isPresent = attendance[session.id]?.[student.id] || false;
                        
                        return (
                           <div key={student.id} 
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                                 isPresent ? 'bg-emerald-500/10 border-emerald-500/30' : 'glass-card border-border/40 hover:border-primary/30'
                                }`}
                                onClick={() => toggleAttendance(session.id, student.id)}
                           >
                              <div className="flex items-center gap-3">
                                 {student.avatarUrl ? (
                                    <img src={student.avatarUrl} alt="Foto" className="h-10 w-10 rounded-full border border-border object-cover" />
                                 ) : (
                                    <div className={`h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm ${isPresent ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                                       {student.name.charAt(0)}
                                    </div>
                                 )}
                                 <div className="flex flex-col">
                                    <span className={`text-sm font-semibold ${isPresent ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                                       {student.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground flex gap-1.5 mt-0.5">
                                      <span>Faixa {student.beltRank}</span>
                                      {student.medicalRestrictions && (
                                         <span className="text-red-500 font-medium flex items-center gap-0.5">
                                            <Activity className="h-3 w-3" /> Ficha Médica!
                                         </span>
                                      )}
                                    </span>
                                 </div>
                              </div>
                              
                              <div className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${isPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30 bg-transparent text-transparent'}`}>
                                 <CheckCircle className="h-4 w-4" />
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Ação de submeter chamada */}
               <div className="sticky bottom-0 left-0 w-full p-4 border-t border-border/50 bg-card/80 backdrop-blur-md">
                 <Button className="w-full rounded-xl shadow-lg shadow-primary/20 h-12 text-md font-bold" onClick={() => alert("Chamada registrada com sucesso! Frequências atualizadas.")}>
                    Finalizar Chamada do Treino
                 </Button>
               </div>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
