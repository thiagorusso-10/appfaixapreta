"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import type { Plan, Student } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Plus, Pencil, Trash2, CreditCard, Tag, Check, X, Star, Users, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function PlanosPage() {
  const { academy } = useAcademy();
  const { 
    plans, 
    students, 
    isLoading, 
    createPlan, 
    updatePlan, 
    deletePlan, 
    updateStudentsPlan 
  } = useApi(academy?.id);
  
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form state do Plano
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planRecurring, setPlanRecurring] = useState(true);
  const [planDescription, setPlanDescription] = useState("");
  const [planClassesWeek, setPlanClassesWeek] = useState("3x");
  const [planBillingDay, setPlanBillingDay] = useState(10);
  const [planIsPopular, setPlanIsPopular] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  
  // Dialog de Students (Vinculo em Lote)
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [activePlanForStudents, setActivePlanForStudents] = useState<Plan | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  if (!academy) return null;

  // ==== AÇÕES DE PLANOS ====
  const openCreateDialog = () => {
    setEditingPlan(null);
    setPlanName("");
    setPlanPrice("");
    setPlanRecurring(true);
    setPlanDescription("");
    setPlanClassesWeek("3x");
    setPlanBillingDay(10);
    setPlanIsPopular(false);
    setPlanFeatures([""]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(plan.price.toString());
    setPlanRecurring(plan.recurring);
    setPlanDescription(plan.description || "");
    setPlanClassesWeek(plan.classesPerWeek || "3x");
    setPlanBillingDay(plan.defaultBillingDay || 10);
    setPlanIsPopular(plan.isPopular || false);
    setPlanFeatures(plan.features?.length ? [...plan.features] : [""]);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!planName || !planPrice) return;
    
    // Limpar features vazias
    const cleanedFeatures = planFeatures.filter(f => f.trim() !== "");

    if (editingPlan) {
      await updatePlan(editingPlan.id, { 
        name: planName, 
        price: parseFloat(planPrice), 
        recurring: planRecurring,
        description: planDescription,
        classesPerWeek: planClassesWeek,
        defaultBillingDay: planBillingDay,
        isPopular: planIsPopular,
        features: cleanedFeatures
      });
    } else {
      await createPlan({
        name: planName,
        price: parseFloat(planPrice),
        recurring: planRecurring,
        description: planDescription,
        classesPerWeek: planClassesWeek,
        defaultBillingDay: planBillingDay,
        isPopular: planIsPopular,
        features: cleanedFeatures
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const studentsInPlan = students.filter(s => s.planId === id).length;
    if (studentsInPlan > 0) {
       alert(`Aviso: Existem ${studentsInPlan} alunos atrelados a este plano. Mude os alunos de plano antes de excluí-lo.`);
       return;
    }
    if (confirm(`Remover definitivamente o plano '${name}'?`)) {
      await deletePlan(id);
    }
  };

  const updateFeature = (index: number, val: string) => {
    const arr = [...planFeatures];
    arr[index] = val;
    setPlanFeatures(arr);
  };
  const removeFeature = (index: number) => {
    const arr = planFeatures.filter((_, i) => i !== index);
    setPlanFeatures(arr.length ? arr : [""]); // Sempre manter pelo menos 1 input
  };
  const addFeature = () => setPlanFeatures([...planFeatures, ""]);

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;


  // ==== AÇÕES DE VINCULAR ALUNOS (LOTE) ====
  
  const handleOpenStudentManager = (plan: Plan) => {
    setActivePlanForStudents(plan);
    setStudentSearch("");
    // Pega todos os alunos neste plano 
    const attached = students.filter(s => s.planId === plan.id).map(s => s.id);
    setSelectedStudentIds(attached);
    setIsManageStudentsOpen(true);
  };

  const handleToggleStudent = (studentId: string) => {
     setSelectedStudentIds(prev => 
        prev.includes(studentId) 
          ? prev.filter(id => id !== studentId) 
          : [...prev, studentId]
     );
  };

  const handleSaveStudentAssociations = async () => {
     if (!activePlanForStudents) return;
     
     await updateStudentsPlan(activePlanForStudents.id, selectedStudentIds);
     setIsManageStudentsOpen(false);
  };

  const visibleStudentsList = students.filter(s => 
    s.status === "ATIVO" && 
    !s.isExemptFromPayment && 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Modelos de Assinatura
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Configure suas ofertas, pacotes anuais ou mensais. Esses planos alimentam o Gerador de Faturas em Lote na aba Financeiro.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="rounded-xl shadow-lg shadow-primary/20 h-11 px-5 font-semibold text-base">
          <Plus className="mr-2 h-5 w-5" /> Criar Modalidade
        </Button>
      </div>

      {/* DIALOG DE PLANO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="text-xl">{editingPlan ? "Editar Plano de Assinatura" : "Elaborar Novo Plano"}</DialogTitle>
            <DialogDescription>
              Defina as características comerciais e vantagens do pacote para conversão dos alunos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            
            {/* Bloco Comercial */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
               <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pacote Comercial</h4>
               <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="planName" className="font-semibold">Título da Oferta <span className="text-red-500">*</span></Label>
                    <Input id="planName" placeholder="Ex: Premium Ilmitado" value={planName} onChange={(e) => setPlanName(e.target.value)} className="rounded-xl h-10" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="planPrice" className="font-semibold">Valor Bruto (R$) <span className="text-red-500">*</span></Label>
                    <Input id="planPrice" type="number" step="0.01" placeholder="150.00" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} className="rounded-xl h-10" />
                  </div>
               </div>

               <div className="grid gap-2 mt-2">
                 <Label htmlFor="planDesc" className="font-semibold">Headline (Propósito do plano)</Label>
                 <Input id="planDesc" placeholder="Ex: O pacote definitivo para competidores assíduos." value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} className="rounded-xl h-10" />
               </div>
            </div>

            {/* Configurações Operacionais */}
            <div className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/50">
               <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Regras e Cobrança</h4>
               <div className="grid sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="freq" className="font-semibold">Aulas na Semana</Label>
                    <select id="freq" className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={planClassesWeek} onChange={e => setPlanClassesWeek(e.target.value)}>
                      <option value="1x">1x na Semana</option>
                      <option value="2x">2x na Semana</option>
                      <option value="3x">3x na Semana</option>
                      <option value="4x">4x na Semana</option>
                      <option value="Livre">Livre (Ilimitado)</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dia" className="font-semibold">Vencimento Exato</Label>
                     <select id="dia" className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={planBillingDay} onChange={e => setPlanBillingDay(Number(e.target.value))}>
                       {[5, 10, 15, 20, 25, 30].map(dia => (
                          <option key={dia} value={dia}>Dia {dia}</option>
                       ))}
                     </select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-semibold">Tag Visível</Label>
                    <div className="flex h-10 items-center justify-start border border-input bg-background rounded-xl px-3 cursor-pointer select-none" onClick={() => setPlanIsPopular(!planIsPopular)}>
                       <Star className={`h-4 w-4 mr-2 ${planIsPopular ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                       <span className="text-sm font-medium">{planIsPopular ? 'Em Destaque' : 'Padrão'}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Listagem de Benefícios */}
            <div className="space-y-3 pt-2">
               <Label className="font-semibold text-base flex items-center justify-between">
                 Lista de Funcionalidades e Vantagens
                 <Button onClick={addFeature} variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                   <Plus className="h-4 w-4 mr-1" /> Add Linha
                 </Button>
               </Label>
               
               <div className="space-y-2">
                 {planFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-emerald-500/50 ml-1" />
                       <Input 
                         placeholder="Ex: Acesso livre aos seminários de exame..." 
                         value={feat} 
                         onChange={(e) => updateFeature(idx, e.target.value)} 
                         className="rounded-xl flex-1 focus-visible:ring-1" 
                       />
                       <Button variant="ghost" size="icon" onClick={() => removeFeature(idx)} className="text-muted-foreground hover:text-red-500">
                         <X className="h-4 w-4" />
                       </Button>
                    </div>
                 ))}
               </div>
            </div>

          </div>
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button onClick={handleSave} className="w-full sm:w-auto rounded-xl px-8 h-11 text-base font-bold shadow-lg shadow-primary/20">
              <Check className="mr-2 h-5 w-5" />
              {editingPlan ? "Atualizar Ficha do Plano" : "Ativar Plano Comercial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* DIALOG GESTAR ALUNOS NO PLANO */}
      <Dialog open={isManageStudentsOpen} onOpenChange={setIsManageStudentsOpen}>
         <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
               <DialogTitle>Gerenciar Turma ({activePlanForStudents?.name})</DialogTitle>
               <DialogDescription>
                  Selecione os alunos vigentes que pertencem a este plano de cobrança. (Alunos já vinculados a outros planos serão transferidos para este automaticamente se marcados).
               </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-4">
                <Input 
                  placeholder="Buscar atleta por nome..." 
                  value={studentSearch} 
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="rounded-xl"
                />

                <div className="border border-border/50 rounded-xl max-h-[300px] overflow-y-auto divide-y divide-border/30 bg-card">
                   {visibleStudentsList.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Nenhum atleta ativo e pagante encontrado.</div>
                   ) : visibleStudentsList.map(student => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      // Pra UI clean, avisamos se ele tá em OUTRO plano.
                      const isFromOtherPlan = !isSelected && student.planId && student.planId !== activePlanForStudents?.id;
                      const otherPlanName = isFromOtherPlan ? plans.find(p => p.id === student.planId)?.name : null;

                      return (
                         <div 
                           key={student.id} 
                           className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                           onClick={() => handleToggleStudent(student.id)}
                         >
                            <div className="shrink-0 text-primary">
                               {isSelected ? <CheckSquare className="h-5 w-5 fill-primary/10" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <div className="flex-1">
                               <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>{student.name}</p>
                               {isFromOtherPlan && (
                                 <p className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 mt-0.5 inline-block rounded font-medium">Troca de Plano ({otherPlanName})</p>
                               )}
                            </div>
                         </div>
                      )
                   })}
                </div>
            </div>

            <DialogFooter>
               <Button onClick={handleSaveStudentAssociations} className="w-full rounded-xl">
                 <Check className="mr-2 h-4 w-4" /> Salvar Lista da Turma
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>


      {/* Grid de Pricing Tables */}
      {plans.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Seu portfólio está vazio</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">Cadastre as modalidades de mensalidade da sua academia para que os alunos possam ser matriculados com inteligência financeira automática.</p>
            <Button onClick={openCreateDialog} className="rounded-xl h-11 px-6 shadow-md shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" /> Iniciar Cadastro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => {
             const qtyStudents = students.filter(s => s.planId === plan.id).length;
             return (
              <Card key={plan.id} className={`glass-card border-0 overflow-hidden relative group flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.isPopular ? 'ring-2 ring-primary/60 scale-[1.02]' : ''}`}>
                
                {/* Background Decorativo Superior */}
                <div className={`h-24 w-full absolute top-0 left-0 -z-10 ${plan.isPopular ? 'bg-linear-to-b from-primary/15 to-transparent' : 'bg-linear-to-b from-muted to-transparent'}`} />
                
                {plan.isPopular && (
                   <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-white" /> Mais Escolhido
                   </div>
                )}
  
                <CardHeader className="pt-8 pb-4 relative">
                  <div className="mb-2">
                     <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${plan.isPopular ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                        Vencimento todo dia {plan.defaultBillingDay || 10}
                     </span>
                     <CardTitle className="text-2xl font-black text-foreground">{plan.name}</CardTitle>
                     {plan.description && (
                        <CardDescription className="mt-2 text-sm leading-relaxed max-w-[90%]">
                           {plan.description}
                        </CardDescription>
                     )}
                  </div>
                </CardHeader>
  
                <CardContent className="flex-1 pb-6 space-y-6">
                  {/* Preço Block */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground tracking-tight">{formatCurrency(plan.price)}</span>
                    <span className="text-muted-foreground font-medium text-sm">/ {plan.recurring ? 'mês' : 'avulso'}</span>
                  </div>
  
                  {/* Divider */}
                  <div className="h-px w-full bg-border/50" />
  
                  {/* Benefícios */}
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-emerald-500/20 p-1 shrinkage-0">
                         <Check className="h-3 w-3 text-emerald-600 font-bold" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Acesso: <strong className="text-primary">{plan.classesPerWeek || "3x"}</strong></span>
                    </li>
                    {plan.features?.filter(f => f.trim() !== "").map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-emerald-500/20 p-1 shrinkage-0">
                           <Check className="h-3 w-3 text-emerald-600 font-bold" />
                        </div>
                        <span className="text-sm text-foreground/80 leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-3 pt-0 mt-auto">
                   
                   <Button 
                      onClick={() => handleOpenStudentManager(plan)}
                      variant="ghost" 
                      className="w-full flex items-center justify-between text-xs font-semibold px-4 py-6 border border-border/50 bg-background/50 hover:bg-muted focus:ring-2 focus:ring-primary h-auto rounded-xl group/btn"
                   >
                      <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary group-hover/btn:scale-110 transition-transform" /> Gerenciar Alunos:</span>
                      <Badge variant="secondary" className="font-bold text-sm bg-primary/10 text-primary">{qtyStudents} Alunos</Badge>
                   </Button>
  
                   <div className="flex w-full gap-2">
                     <Button variant="outline" onClick={() => openEditDialog(plan)} className="flex-1 rounded-xl h-10 border-border bg-transparent hover:bg-muted font-semibold text-xs shadow-sm">
                       <Pencil className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Configs
                     </Button>
                     <Button variant="outline" onClick={() => handleDelete(plan.id, plan.name)} className="w-12 px-0 rounded-xl h-10 hover:bg-red-500 hover:text-white hover:border-red-500 text-muted-foreground border-border transition-colors">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                </CardFooter>
              </Card>
             );
          })}
        </div>
      )}
    </div>
  );
}
