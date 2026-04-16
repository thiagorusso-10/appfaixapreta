"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAcademy } from "@/contexts/AcademyThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Layers, Plus, Clock, User, Trash2, Edit3, Loader2 } from "lucide-react";
import { Turma } from "@/lib/types";

export default function TurmasPage() {
  const { academy } = useAcademy();
  const { turmas, students, createTurma, updateTurma, deleteTurma, isLoading } = useApi(academy?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Turma>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string>("");
  const [viewingStudentsFor, setViewingStudentsFor] = useState<Turma | null>(null);

  const resetForm = () => {
    setFormData({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setIsSubmitting(true);
    
    if (isEditing && formData.id) {
      await updateTurma(formData.id, formData);
    } else {
      await createTurma(formData);
    }
    
    setIsSubmitting(false);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar esta turma? Os alunos associados a ela perderão o vínculo e ficarão sem turma.")) {
      setIsDeleting(id);
      await deleteTurma(id);
      setIsDeleting("");
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            Gestão de Turmas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie turmas para organizar seus alunos, horários e filtragens no check-in.
          </p>
        </div>

        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Nova Turma
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-[425px] border-border/50 shadow-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {isEditing ? "Editar Turma" : "Criar Nova Turma"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Turma</Label>
                <Input
                  id="name"
                  placeholder="Ex: Kids Manhã"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl bg-background border-border focus-visible:ring-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule">Horário / Dias (opcional)</Label>
                <Input
                  id="schedule"
                  placeholder="Ex: Seg e Qua às 18:30"
                  value={formData.schedule || ""}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="rounded-xl bg-background border-border focus-visible:ring-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="professor">Professor Responsável (opcional)</Label>
                <Input
                  id="professor"
                  placeholder="Ex: Sensei Thiago"
                  value={formData.professor || ""}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                  className="rounded-xl bg-background border-border focus-visible:ring-primary/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || isSubmitting} className="rounded-xl">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Salvar Turma"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : turmas.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Sua academia ainda não tem turmas</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ao criar turmas, você poderá vincular os alunos a elas e facilitar muito o filtro de presenças.
            </p>
            <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setIsDialogOpen(true)}>
              Criar Minha Primeira Turma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas.map((turma, idx) => {
            const alunosNestaTurma = students.filter(s => s.turmaId === turma.id).length;
            
            return (
              <Card 
                key={turma.id} 
                className="overflow-hidden border-0 relative transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 glass-card group hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-primary to-primary/50" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">{turma.name}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10"
                        onClick={() => {
                          setFormData(turma);
                          setIsEditing(true);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                        onClick={() => handleDelete(turma.id)}
                        disabled={isDeleting === turma.id}
                      >
                        {isDeleting === turma.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary/70 shrink-0" />
                      <span className="truncate">{turma.schedule || "Sem horário definido"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4 text-primary/70 shrink-0" />
                      <span className="truncate">{turma.professor || "Sem professor vinculado"}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setViewingStudentsFor(turma)}
                    className="pt-4 border-t border-border/50 flex items-center justify-between w-full hover:opacity-70 transition-opacity focus:outline-none"
                  >
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Alunos Matriculados
                    </span>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                      {alunosNestaTurma}
                    </div>
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Visualizador de Alunos da Turma */}
      <Dialog open={!!viewingStudentsFor} onOpenChange={(open) => !open && setViewingStudentsFor(null)}>
        <DialogContent className="sm:max-w-[425px] border-border/50 shadow-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex justify-between items-center pr-6">
              <span className="line-clamp-1">{viewingStudentsFor?.name}</span>
              <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none shrink-0 rounded-full">
                {students.filter(s => s.turmaId === viewingStudentsFor?.id).length}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
             {students.filter(s => s.turmaId === viewingStudentsFor?.id).length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno matriculado nesta turma.</p>
             ) : (
               students.filter(s => s.turmaId === viewingStudentsFor?.id).map(student => (
                 <div key={student.id} className="flex justify-between items-center p-3 rounded-xl border border-border/50 bg-background hover:bg-muted/30 transition-colors">
                   <div className="flex items-center gap-3">
                     {student.avatarUrl ? (
                         <img src={student.avatarUrl} alt={student.name} className="h-10 w-10 rounded-full object-cover border border-border" />
                     ) : (
                         <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                           {student.name.charAt(0)}
                         </div>
                     )}
                     <div>
                       <p className="font-medium text-sm text-foreground">{student.name}</p>
                       <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{student.modality} • Faixa {student.beltRank}</p>
                     </div>
                   </div>
                 </div>
               ))
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
