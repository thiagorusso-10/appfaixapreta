"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, Users, Video, Plus, Trash2, Edit3, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const diasDaSemana = [
  { id: 1, nome: "Segunda-feira" },
  { id: 2, nome: "Terça-feira" },
  { id: 3, nome: "Quarta-feira" },
  { id: 4, nome: "Quinta-feira" },
  { id: 5, nome: "Sexta-feira" },
  { id: 6, nome: "Sábado" },
];

export default function AulasPage() {
  const { academy } = useAcademy();
  const { classes: sessions, isLoading, createClassSession, deleteClassSession } = useApi(academy?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
     modality: string;
     level: "Kids" | "Iniciante" | "Avançado" | "Todos";
     weekDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
     time: string;
     maxStudents: number;
  }>({
     modality: "Jiu-Jitsu",
     level: "Iniciante",
     weekDay: 1,
     time: "19:00",
     maxStudents: 20
  });

  if (!academy || isLoading) return null;

  const handleSaveClass = async () => {
     await createClassSession(formData);
     setIsDialogOpen(false);
  };

  const handleDeleteClass = async (id: string, mod: string) => {
     if(confirm(`Tem certeza que deseja remover ${mod} da grade semanal de forma permanente?`)) {
         await deleteClassSession(id);
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Grade de Aulas</h1>
          <p className="text-muted-foreground mt-1">Organize os horários da sua academia e planeje as técnicas do dia a dia.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all">
          <Plus className="mr-2 h-4 w-4" /> Nova Turma Fixa
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Bloco Horário</DialogTitle>
              <DialogDescription>A turma se repetirá toda semana neste módulo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="modality">Modalidade</Label>
                <select id="modality" className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={formData.modality} onChange={e => setFormData({...formData, modality: e.target.value})}>
                   <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                   <option value="Muay Thai">Muay Thai</option>
                   <option value="Judo">Kyokushin / Judô</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dia">Dia da Semana</Label>
                  <select id="dia" className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={formData.weekDay} onChange={e => setFormData({...formData, weekDay: Number(e.target.value) as 0|1|2|3|4|5|6})}>
                    {diasDaSemana.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Horário (Início)</Label>
                  <Input id="time" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="level">Nível Marcial</Label>
                    <select id="nivel" className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as "Kids" | "Iniciante" | "Avançado" | "Todos"})}>
                      <option value="Iniciante">Iniciante</option>
                      <option value="Avançado">Avançado</option>
                      <option value="Todos">Todos (Livre)</option>
                    </select>
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="vagas">Capacidade Teto</Label>
                    <Input id="vagas" type="number" value={formData.maxStudents} onChange={e => setFormData({...formData, maxStudents: Number(e.target.value)})}/>
                 </div>
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSaveClass}>Criar Turma na Matriz</Button>
          </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {diasDaSemana.map(dia => {
          const classesForDay = sessions.filter(s => s.weekDay === dia.id);
          
          return (
            <div key={dia.id} className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b border-border pb-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                {dia.nome}
              </h3>
              
              {classesForDay.length > 0 ? (
                <div className="space-y-3">
                  {classesForDay.map(session => {
                    return (
                      <Card key={session.id} className="border-border shadow-md glass-card hover:border-primary/50 transition-colors group">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                             <div>
                               <CardTitle className="text-base font-bold text-foreground">{session.modality}</CardTitle>
                               <CardDescription className="flex items-center mt-1 text-sm">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> {session.time} {/* Property in Mock is 'time' not 'scheduleTime' */}
                               </CardDescription>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{session.level}</Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteClass(session.id, session.modality)}>
                                   <Trash2 className="h-3 w-3" />
                                </Button>
                             </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1.5" /> Capacidade: máx. {session.maxStudents || 20} vagas
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-6 bg-card/40 rounded-xl border border-dashed border-border/60 text-center flex flex-col items-center justify-center gap-2">
                   <Calendar className="w-8 h-8 opacity-20" />
                   Nenhuma frente aberta
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}

// Custom simple calendar icon helper since I didn't import from lucide in main block for some reason
function CalendarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
