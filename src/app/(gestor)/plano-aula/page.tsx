"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { LessonPlan } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, Plus, Trash2, CalendarDays, BookOpen, Clock, Filter, Pencil } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlanoAulaPage() {
  const { academy } = useAcademy();
  const { turmas, lessonPlans, createLessonPlan, updateLessonPlan, deleteLessonPlan, isLoading } = useApi(academy?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterSession, setFilterSession] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    turmaId: "",
    date: new Date().toISOString().split("T")[0],
    title: "",
    content: "",
    observations: ""
  });

  useEffect(() => {
    if (turmas.length > 0 && !formData.turmaId) {
      setFormData(prev => ({ ...prev, turmaId: turmas[0].id }));
    }
  }, [turmas]);


  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Preencha ao menos o Título do plano de aula.");
      return;
    }
    
    setIsSubmitting(true);
    if (formData.id) {
      await updateLessonPlan(formData.id, {
        turmaId: formData.turmaId,
        date: formData.date,
        title: formData.title,
        content: formData.content,
        observations: formData.observations
      });
    } else {
      await createLessonPlan({
        turmaId: formData.turmaId,
        date: formData.date,
        title: formData.title,
        content: formData.content,
        observations: formData.observations
      });
    }
    setIsSubmitting(false);
    setIsDialogOpen(false);
    setFormData({ id: "", turmaId: turmas[0]?.id || "", date: new Date().toISOString().split("T")[0], title: "", content: "", observations: "" });
  };

  const handleEdit = (plan: LessonPlan) => {
    setFormData({
      id: plan.id,
      turmaId: plan.turmaId || "",
      date: plan.date, // Formato "YYYY-MM-DD"
      title: plan.title,
      content: plan.content,
      observations: plan.observations || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este plano de aula?")) {
      await deleteLessonPlan(id);
    }
  };

  const getSessionLabel = (turmaId?: string) => {
    if (!turmaId) return "Geral";
    const t = turmas.find(x => x.id === turmaId);
    if (!t) return "Turma desconhecida";
    return `${t.name} ${t.schedule ? `— ${t.schedule}` : ''}`;
  };

  const filteredPlans = filterSession === "ALL"
    ? lessonPlans
    : lessonPlans.filter(p => p.turmaId === filterSession);

  const groupedPlans = useMemo(() => {
    return filteredPlans.reduce((acc, plan) => {
      // Ajuste de fuso horário fixando horário ao meio dia ao instanciar Date no Brasil: T12:00:00
      const d = new Date(plan.date + "T12:00:00");
      const monthYear = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      
      if (!acc[capitalized]) acc[capitalized] = [];
      acc[capitalized].push(plan);
      return acc;
    }, {} as Record<string, LessonPlan[]>);
  }, [filteredPlans]);

  if (!academy || isLoading) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <PenTool className="h-7 w-7 text-primary" />
            Plano de Aula
          </h1>
          <p className="text-muted-foreground mt-1">Planeje suas aulas e mantenha um histórico consultável a qualquer momento.</p>
        </div>
        <Button onClick={() => {
          setFormData({ id: "", turmaId: turmas[0]?.id || "", date: new Date().toISOString().split("T")[0], title: "", content: "", observations: "" });
          setIsDialogOpen(true);
        }} className="bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all">
          <Plus className="mr-2 h-4 w-4" /> Novo Plano
        </Button>
      </div>

      {/* Modal de Novo Plano */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formData.id ? "Editar Plano de Aula" : "Criar Plano de Aula"}</DialogTitle>
            <DialogDescription>Descreva o conteúdo e a sequência didática para esta sessão de treino.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-date">Data da Aula</Label>
                <Input id="plan-date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-session">Turma</Label>
                <select
                  id="plan-session"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.turmaId}
                  onChange={e => setFormData({ ...formData, turmaId: e.target.value })}
                >
                  <option value="">Geral (Todas as Turmas)</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.schedule ? `(${t.schedule})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-title">Título / Tema Principal <span className="text-red-500">*</span></Label>
              <Input id="plan-title" placeholder="Ex: Armlock da Guarda Fechada" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-content">Conteúdo / Sequência Didática</Label>
              <textarea
                id="plan-content"
                placeholder={"1. Aquecimento (10min)\n2. Demonstração da técnica\n3. Drills em dupla\n4. Randori posicional"}
                className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-obs">Observações (opcional)</Label>
              <Input id="plan-obs" placeholder="Notas extras para lembrar..." value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })} />
            </div>
          </div>
          <Button className="w-full rounded-xl" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? "Salvando..." : "Salvar Plano de Aula"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Filtro por Turma */}
      {turmas.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            value={filterSession}
            onChange={e => setFilterSession(e.target.value)}
          >
            <option value="ALL">Todas as turmas</option>
            <option value="">Geral (Sem Especificar)</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Listagem / Histórico de Planos */}
      {filteredPlans.length === 0 ? (
        <Card className="glass-card border-0 mt-4">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum plano de aula ainda</h3>
            <p className="text-sm text-muted-foreground">Clique no botão "Novo Plano" para começar a organizar suas aulas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="pt-2">
          <Tabs defaultValue={Object.keys(groupedPlans)[0]} className="w-full">
            {/* Lista de Abas */}
            <div className="relative mb-6 overflow-x-auto pb-2 scrollbar-none border-b border-border">
               <TabsList className="bg-transparent h-auto p-0 flex space-x-6 justify-start">
                 {Object.keys(groupedPlans).map((month) => (
                   <TabsTrigger 
                     key={month} 
                     value={month}
                     className="relative py-2 px-1 font-bold text-foreground/60 rounded-none shadow-none border-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
                   >
                     {month}
                   </TabsTrigger>
                 ))}
               </TabsList>
            </div>

            {/* Conteúdo de cada Aba */}
            {Object.entries(groupedPlans).map(([month, monthPlansRaw]) => {
              const monthPlans = monthPlansRaw as any[];
              return (
              <TabsContent key={month} value={month} className="mt-0 space-y-4 animate-in fade-in-50 duration-500">
                 <div className="grid gap-4">
                   {monthPlans.map((plan: any) => (
                     <Card key={plan.id} className="glass-card border-0 overflow-hidden relative group hover:shadow-lg hover:shadow-primary/5 transition-all">
                       <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/60" />
                       <CardHeader className="pb-2">
                         <div className="flex justify-between items-start">
                           <div>
                             <CardTitle className="text-lg font-bold text-foreground">{plan.title}</CardTitle>
                             <CardDescription className="flex items-center gap-3 mt-1 flex-wrap">
                               <span className="flex items-center gap-1 font-semibold text-foreground/80">
                                 <CalendarDays className="h-3.5 w-3.5" />
                                 {new Date(plan.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                               </span>
                               <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">{getSessionLabel(plan.turmaId)}</Badge>
                             </CardDescription>
                           </div>
                           <div className="flex bg-card border border-border shadow-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-r-none border-r border-border"
                               onClick={() => handleEdit(plan)}>
                               <Pencil className="h-3.5 w-3.5" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-l-none"
                               onClick={() => handleDelete(plan.id)}>
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                           </div>
                         </div>
                       </CardHeader>
                       <CardContent className="pb-4">
                         {plan.content && (
                           <div className="bg-muted/30 rounded-xl p-3 mb-3 border border-border/50">
                             <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1.5">Sequência Didática</p>
                             <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{plan.content}</pre>
                           </div>
                         )}
                         {plan.observations && (
                           <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/20">
                             <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600 mb-1">Observações</p>
                             <p className="text-sm text-foreground/80">{plan.observations}</p>
                           </div>
                         )}
                         <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                           <Clock className="h-3 w-3" /> Criado em {new Date(plan.createdAt).toLocaleDateString("pt-BR")} às {new Date(plan.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                         </p>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
              </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </div>
  );
}
