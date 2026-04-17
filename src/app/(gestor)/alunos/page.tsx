"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { plansMock } from "@/lib/mockData";
import { BeltRank, UserRole, type Student } from "@/lib/types";
import { useState, useRef } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Search, Plus, Minus, User, Activity, FileText, Check, Edit3, Award, FileDown, UploadCloud, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

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
const BELT_HIERARCHY = ['PRETA', 'MARROM', 'ROXA', 'VERDE', 'LARANJA', 'AMARELA', 'AZUL', 'CINZA', 'BRANCA'];

export default function AlunosPage() {
  const { academy } = useAcademy();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const initialFormState: Partial<Student> = {
    name: "",
    email: "",
    isExemptFromPayment: false,
    guardianName: "",
    guardianPhone: "",
    birthDate: "",
    weight: "",
    phone: "",
    avatarUrl: "",
    status: "ATIVO",
    turmaId: "",
  };

  const [formData, setFormData] = useState<Partial<Student>>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTurma, setSelectedTurma] = useState<string>("all");

  // Carregando toda as funções reais da nuvem Supabase
  const { students, plans, isLoading, createStudent, updateStudent, uploadAvatar, deleteStudent, turmas } = useApi(academy?.id);

  if (!academy || isLoading) return null;

  const filteredStudents = students
    .filter(s => {
      if (selectedTurma !== "all" && s.turmaId !== selectedTurma) return false;
      return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .sort((a, b) => {
      // Ordenar por hierarquia de faixa (mais graduados primeiro)
      const aIdx = BELT_HIERARCHY.indexOf(a.beltRank.toUpperCase());
      const bIdx = BELT_HIERARCHY.indexOf(b.beltRank.toUpperCase());
      if (aIdx !== bIdx) return aIdx - bIdx;
      // Mesma faixa: ordenar por grau (maior grau primeiro)
      const aDeg = (a as any).beltDegree || 0;
      const bDeg = (b as any).beltDegree || 0;
      if (aDeg !== bDeg) return bDeg - aDeg;
      // Mesmo grau: alfabético
      return a.name.localeCompare(b.name);
    });

  const openNewStudentModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setAvatarFile(null);
    setIsDialogOpen(true);
  };

  const handleMarkAsReady = async (studentId: string, studentName: string) => {
    if (confirm(`Dar aval técnico para que ${studentName} realize Exame de Faixa? Ele será transferido para a fila no Painel de Graduação e aguardará avaliação e aprovação final de nível.`)) {
      await updateStudent(studentId, { isReadyForExam: true });
      alert(`${studentName} sinalizado como Apto! Veja-o figurar entre a listagem principal na aba Graduação!`);
      // Atualizar lista real local fechando e forçando sync
      setSelectedStudent(null);
    }
  };

  const handleSaveStudent = async () => {
    if (!formData.name || formData.name.trim() === "") {
        alert("Preencha ao menos o Nome Completo para cadastrar ou salvar o Aluno.");
        return; 
    }

    const payload = { ...formData };

    if (avatarFile) {
        // Mostra loader no cursor ou algo simples
        document.body.style.cursor = "wait";
        const uploadedUrl = await uploadAvatar(avatarFile);
        document.body.style.cursor = "default";
        if (uploadedUrl) {
            payload.avatarUrl = uploadedUrl;
        } else {
            alert("Houve uma falha ao subir a foto, mas o aluno será salvo sem ela.");
        }
    }

    if (isEditing && payload.id) {
       await updateStudent(payload.id, payload);
       alert("Ficha do aluno atualizada!");
       setSelectedStudent(prev => prev ? { ...prev, ...payload } : null);
    } else {
       const res = await createStudent(payload);
       if (res?.error) {
           const errMsg = typeof res.error === 'string' ? res.error : (res.error as any)?.message || JSON.stringify(res.error);
           alert(`Houve um erro no banco (Supabase) ao salvar o aluno: ${errMsg}`);
       } else {
           alert("Novo aluno matriculado com sucesso!");
       }
    }

    setIsDialogOpen(false);
    setFormData(initialFormState);
    setAvatarFile(null);
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("🚨 TEM CERTEZA que deseja excluir permanentemente este aluno(a) do banco de dados? Todo o histórico de check-ins e financeiro será apagado junto.")) {
       const res = await deleteStudent(id);
       if (res?.error) {
           alert("Erro ao excluir: " + JSON.stringify(res.error));
       } else {
           alert("Aluno excluído com sucesso!");
           setSelectedStudent(null);
       }
    }
  };

  const handleExportPDF = async () => {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(academy.name, 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`CNPJ: ${academy.documentNumber}`, 14, 27);
    doc.text(`Relatório Geral de Alunos — ${new Date().toLocaleDateString('pt-BR')}`, 14, 33);
    
    // Linha separadora
    doc.setDrawColor(200);
    doc.line(14, 36, 196, 36);

    // Tabela
    const tableRows = filteredStudents.map(s => {
      const progress = ((s.classesAttendedToNextRank / s.classesTargetForNextRank) * 100).toFixed(0);
      return [
        s.name,
        s.email || 'N/A',
        s.beltRank,
        `${progress}%`,
        s.status
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['Nome', 'E-mail', 'Faixa', 'Progresso', 'Status']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`lista_alunos_${academy.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    // @ts-ignore
    const checked = type === "checkbox" ? e.target.checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value
    }));
  };

  return (
    <div className="space-y-6 animate-slide-up flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie matrículas, graduações e status da base de alunos.</p>
        </div>
        
        {/* ADD / EDIT STUDENT DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openNewStudentModal} className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Novo Aluno
          </Button>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Aluno" : "Matricular Aluno"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Atualize as informações completas do atleta abaixo." : "Preencha a ficha cadastral do aluno com informações de tutores e biometria."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              
              {/* Seção 1: Dados Base */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label>Foto de Perfil do Atleta</Label>
                  <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-xl border border-border/50">
                    {/* Imagem Atual Mapeada */}
                    {formData.avatarUrl && !avatarFile && (
                       <img src={formData.avatarUrl} alt="Atual" className="h-14 w-14 rounded-full border-2 border-primary/20 object-cover shadow-sm bg-background" />
                    )}
                    
                    {/* Imagem em Status "Preparada pra Envio" */}
                    {avatarFile && (
                       <div className="h-14 w-14 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
                          <Check className="h-6 w-6" />
                       </div>
                    )}
                    
                    {/* Avatar Placeholder Vazio */}
                    {!formData.avatarUrl && !avatarFile && (
                       <div className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/40 flex items-center justify-center text-muted-foreground">
                          <User className="h-6 w-6 opacity-30" />
                       </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 font-semibold text-xs shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors group"
                      >
                         <UploadCloud className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
                         Escolher Foto
                      </Button>
                      <span className="text-[10px] text-muted-foreground">
                        {avatarFile ? avatarFile.name : "JPEG, PNG... (Aspecto 1:1 Funciona Melhor)"}
                      </span>
                    </div>

                    <Input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                         if (e.target.files && e.target.files.length > 0) {
                            setAvatarFile(e.target.files[0]);
                         }
                      }} 
                    />
                  </div>
                </div>
                
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="name">Nome Completo <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="Ex: Lucas Pereira" value={formData.name || ""} onChange={handleChange} required />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input id="birthDate" type="date" value={formData.birthDate || ""} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="beltRank">Faixa Atual</Label>
                  <select 
                    id="beltRank" 
                    value={formData.beltRank} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.values(BeltRank).map(belt => (
                      <option key={belt} value={belt}>{belt}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="beltDegree">Grau da Faixa</Label>
                  <select 
                    id="beltDegree" 
                    value={formData.beltDegree || 0} 
                    onChange={(e) => setFormData(prev => ({ ...prev, beltDegree: parseInt(e.target.value) }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value={0}>Sem grau</option>
                    <option value={1}>1º grau</option>
                    <option value={2}>2º grau</option>
                    <option value={3}>3º grau</option>
                    <option value={4}>4º grau</option>
                  </select>
                </div>
                
                <div className="col-span-2 grid gap-2 mt-2">
                  <Label htmlFor="turmaId">Vincular Atleta a uma Turma</Label>
                  <select 
                    id="turmaId" 
                    value={formData.turmaId || ""} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border bg-primary/5 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border-primary/20"
                  >
                    <option value="">Nenhuma turma vinculada (Fluxo Aberto)</option>
                    {turmas.map(t => (
                       <option key={t.id} value={t.id}>{t.name} {t.schedule ? `(${t.schedule})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 grid gap-2 mt-2">
                  <Label htmlFor="status">Situação Matricial do Aluno</Label>
                  <select 
                    id="status" 
                    value={formData.status || "ATIVO"} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-muted/40 font-semibold px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value="ATIVO">🟢 Ativo (Frequente)</option>
                    <option value="INATIVO">🟡 Inativo (Licença/Afastado)</option>
                    <option value="EVADIDO">🔴 Evadido (Desistente)</option>
                  </select>
                </div>
              </div>

               {/* Seção Nova: Vinculação Financeira */}
               <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Plano Vigente</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="planId" className="font-semibold text-foreground/80">
                       Vincular a Pacote / Assinatura
                    </Label>
                    <select 
                      id="planId" 
                      value={formData.planId || ""} 
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                      <option value="">Nenhum plano (Avulso ou Isento)</option>
                      {plans.map(plan => (
                         <option key={plan.id} value={plan.id}>{plan.name} — R$ {plan.price}</option>
                      ))}
                    </select>
                  </div>
               </div>

               {/* Seção 2: Contatos */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mails de Acesso (Para o App, separados por vírgula)</Label>
                    <Input id="email" type="text" placeholder="mae@gmail.com, pai@hotmail.com" value={formData.email || ""} onChange={handleChange} />
                  </div>
                 <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input id="phone" type="tel" placeholder="(11) 99999-9999" value={formData.phone || ""} onChange={handleChange} />
                 </div>
               </div>

                {/* Seção 3: Isenção Infantil */}
               <div className="bg-muted/40 p-4 rounded-xl border border-border/50 space-y-4">
                  <div className="flex items-center space-x-2">
                     <input 
                        type="checkbox" 
                        id="isExemptFromPayment" 
                        className="w-4 h-4 rounded-sm border-primary text-primary focus:ring-primary"
                        checked={formData.isExemptFromPayment || false}
                        onChange={handleChange}
                     />
                     <Label htmlFor="isExemptFromPayment" className="font-semibold cursor-pointer">
                        Aluno Isento / Menor de Idade (Kids)
                     </Label>
                  </div>
                  
                  {formData.isExemptFromPayment && (
                     <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50 animate-in fade-in zoom-in-95">
                        <div className="grid gap-2">
                          <Label htmlFor="guardianName">Responsável / Tutor (Obrigatório)</Label>
                          <Input id="guardianName" placeholder="Identifique o Pai/Mãe" value={formData.guardianName || ""} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="guardianPhone">Contato Responsável</Label>
                          <Input id="guardianPhone" type="tel" placeholder="Telefone de Emergência" value={formData.guardianPhone || ""} onChange={handleChange} />
                        </div>
                     </div>
                  )}
               </div>

               {/* Seção 4: Biometria */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="weight">Peso do Atleta (kg)</Label>
                    <Input id="weight" type="number" step="0.1" placeholder="Ex: 75.5" value={formData.weight || ""} onChange={handleChange} />
                 </div>
               </div>

            </div>
            <DialogFooter>
              <Button type="button" onClick={handleSaveStudent}>
                {isEditing ? "Salvar Alterações" : "Efetivar Matrícula"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Buscar por nome ou e-mail..." 
            className="pl-10 h-11 rounded-xl bg-muted/20 border-border/50 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          value={selectedTurma}
          onChange={(e) => setSelectedTurma(e.target.value)}
          className="h-11 rounded-xl bg-muted/20 border border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground min-w-[180px] font-medium"
        >
          <option value="all">Todas as turmas</option>
          {turmas.map(t => (
             <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        
        <div className="flex items-center gap-2">
           <Button 
             variant="outline" 
             onClick={handleExportPDF} 
             className="h-11 rounded-xl shadow-sm font-semibold border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all flex items-center gap-2"
           >
             <FileDown className="h-4 w-4" />
             <span className="hidden sm:inline">Exportar Lista</span>
           </Button>

           <Button 
             onClick={openNewStudentModal} 
             className="h-11 bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold flex items-center gap-2"
           >
             <Plus className="h-4 w-4" />
             Nova Matrícula
           </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Faixa / Nível</TableHead>
              <TableHead>Progresso (Próxima Faixa)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const progressValue = (student.classesAttendedToNextRank / student.classesTargetForNextRank) * 100;
                
                return (
                  <TableRow 
                    key={student.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{student.name}</span>
                        <span className="text-xs text-muted-foreground">{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 max-w-[200px]">
                        <Progress value={progressValue} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {student.classesAttendedToNextRank} / {student.classesTargetForNextRank} aul.
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant={student.status === "ATIVO" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhum aluno encontrado para sua busca.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* FICHA DO ALUNO (PROFESSOR) */}
      <Sheet open={!!selectedStudent} onOpenChange={(open: boolean) => !open && setSelectedStudent(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] glass-card border-none shadow-2xl p-0 h-full overflow-y-auto">
          {selectedStudent && (
            <>
              <SheetHeader className="p-6 pb-6 border-b border-border/50 bg-muted/20">
                <SheetTitle className="flex items-center gap-4">
                  {selectedStudent.avatarUrl ? (
                    <img src={selectedStudent.avatarUrl} alt="Avatar" className="h-14 w-14 rounded-xl border border-border" />
                  ) : (
                    <div className="h-14 w-14 bg-linear-to-br from-primary to-primary/60 text-primary-foreground rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                       {selectedStudent.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col text-left flex-1">
                    <span className="text-xl tracking-tight">{selectedStudent.name}</span>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-1">
                      <span>{selectedStudent.email || "Sem e-mail"}</span>
                      <span>•</span>
                      <Badge variant="outline" className={`w-[110px] justify-between uppercase text-[10px] tracking-wider font-semibold border ${BELT_COLORS[selectedStudent.beltRank.toUpperCase()] || 'bg-muted text-muted-foreground'} flex items-center`}>
                        <span>{selectedStudent.beltRank}</span>
                        {(selectedStudent.beltDegree || 0) > 0 && (
                          <span className="flex items-center gap-[2px]">
                            {Array.from({ length: selectedStudent.beltDegree || 0 }).map((_, i) => (
                              <span key={i} className={`inline-block w-[3px] h-3 rounded-full opacity-90 ${
                                ['BRANCA', 'PRETA'].includes(selectedStudent.beltRank.toUpperCase()) ? 'bg-red-600' : 'bg-white'
                              }`} />
                            ))}
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full shadow-sm hover:bg-primary/5 hover:text-primary transition-colors" 
                      title="Editar Aluno"
                      onClick={() => {
                         setFormData(selectedStudent);
                         setAvatarFile(null);
                         setIsEditing(true);
                         setIsDialogOpen(true);
                      }}
                    >
                       <Edit3 className="h-4 w-4" />
                    </Button>

                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full shadow-sm text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 transition-colors" 
                      title="Excluir Aluno"
                      onClick={() => handleDeleteStudent(selectedStudent.id)}
                    >
                       <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500">

                {/* Sub-informações Adicionadas (Idade, Peso, Contatos) */}
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border/50 text-sm">
                   <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Contato</span>
                      <span className="font-medium truncate">{selectedStudent.phone || "Não informado"}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Nascimento</span>
                      <span className="font-medium truncate">{selectedStudent.birthDate ? new Date(selectedStudent.birthDate).toLocaleDateString('pt-BR') : "Não informado"}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Peso / Cat.</span>
                      <span className="font-medium truncate">{selectedStudent.weight ? `${selectedStudent.weight} kg` : "-"}</span>
                   </div>
                   {selectedStudent.isExemptFromPayment && (
                     <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Tutor (Isento / Kid)</span>
                        <span className="font-medium truncate text-primary">{selectedStudent.guardianName || "Sem Responsável"}</span>
                     </div>
                   )}
                </div>

                {/* Controle Manual de Progressão de Aulas */}
                <div className="space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                   <h4 className="text-sm font-bold flex items-center gap-2 text-foreground tracking-tight">
                     <Activity className="h-4 w-4 text-primary" />
                     Controle de Progressão (Tatame)
                   </h4>
                   <div className="grid grid-cols-2 gap-4">
                      {/* Aulas Realizadas */}
                      <div className="space-y-2">
                         <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Aulas Realizadas</span>
                         <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg border-border/80 hover:bg-destructive/10 hover:text-destructive"
                              onClick={async () => {
                                const newVal = Math.max(0, (selectedStudent.classesAttendedToNextRank || 0) - 1);
                                await updateStudent(selectedStudent.id, { classesAttendedToNextRank: newVal });
                                setSelectedStudent(prev => prev ? { ...prev, classesAttendedToNextRank: newVal } : null);
                              }}
                            >
                               <Minus className="h-3 w-3" />
                            </Button>
                            <input 
                              type="number" 
                              min="0"
                              className="w-16 h-8 text-center text-sm font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={selectedStudent.classesAttendedToNextRank || 0}
                              onChange={async (e) => {
                                const newVal = Math.max(0, parseInt(e.target.value) || 0);
                                setSelectedStudent(prev => prev ? { ...prev, classesAttendedToNextRank: newVal } : null);
                              }}
                              onBlur={async (e) => {
                                const newVal = Math.max(0, parseInt(e.target.value) || 0);
                                await updateStudent(selectedStudent.id, { classesAttendedToNextRank: newVal });
                              }}
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg border-border/80 hover:bg-emerald-500/10 hover:text-emerald-600"
                              onClick={async () => {
                                const newVal = (selectedStudent.classesAttendedToNextRank || 0) + 1;
                                await updateStudent(selectedStudent.id, { classesAttendedToNextRank: newVal });
                                setSelectedStudent(prev => prev ? { ...prev, classesAttendedToNextRank: newVal } : null);
                              }}
                            >
                               <Plus className="h-3 w-3" />
                            </Button>
                         </div>
                      </div>

                      {/* Meta de Aulas */}
                      <div className="space-y-2">
                         <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Meta p/ Faixa</span>
                         <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg border-border/80 hover:bg-destructive/10 hover:text-destructive"
                              onClick={async () => {
                                const newVal = Math.max(1, (selectedStudent.classesTargetForNextRank || 30) - 5);
                                await updateStudent(selectedStudent.id, { classesTargetForNextRank: newVal } as any);
                                setSelectedStudent(prev => prev ? { ...prev, classesTargetForNextRank: newVal } : null);
                              }}
                            >
                               <Minus className="h-3 w-3" />
                            </Button>
                            <input 
                              type="number" 
                              min="1"
                              className="w-16 h-8 text-center text-sm font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={selectedStudent.classesTargetForNextRank || 30}
                              onChange={async (e) => {
                                const newVal = Math.max(1, parseInt(e.target.value) || 30);
                                setSelectedStudent(prev => prev ? { ...prev, classesTargetForNextRank: newVal } : null);
                              }}
                              onBlur={async (e) => {
                                const newVal = Math.max(1, parseInt(e.target.value) || 30);
                                await updateStudent(selectedStudent.id, { classesTargetForNextRank: newVal } as any);
                              }}
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg border-border/80 hover:bg-emerald-500/10 hover:text-emerald-600"
                              onClick={async () => {
                                const newVal = (selectedStudent.classesTargetForNextRank || 30) + 5;
                                await updateStudent(selectedStudent.id, { classesTargetForNextRank: newVal } as any);
                                setSelectedStudent(prev => prev ? { ...prev, classesTargetForNextRank: newVal } : null);
                              }}
                            >
                               <Plus className="h-3 w-3" />
                            </Button>
                         </div>
                      </div>
                   </div>
                   <p className="text-[10px] text-muted-foreground leading-tight opacity-70">
                     Cada check-in do totem incrementa automaticamente. Use os botões acima para corrigir manualmente conforme a regra da sua academia.
                   </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-foreground tracking-tight">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Prontuário Médico
                  </h4>
                  <p className="text-sm text-muted-foreground bg-destructive/5 border border-destructive/20 p-4 rounded-xl">
                    {selectedStudent.medicalRestrictions || "Nenhuma restrição médica reportada. Apto para treinos de alta intensidade."}
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-foreground tracking-tight">
                    <FileText className="h-4 w-4 text-primary" />
                    Anotações do Professor
                  </h4>
                  <textarea 
                    className="w-full text-sm bg-muted/30 border border-border/80 rounded-xl p-4 min-h-[160px] focus:ring-2 focus:ring-primary/50 outline-none resize-none transition-all placeholder:text-muted-foreground/50"
                    placeholder={`Deixe um parecer técnico sobre o desempenho do(a) aluno(a) ${selectedStudent.name.split(' ')[0]} nos treinos da semana...`}
                  />
                  <Button size="lg" className="w-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform rounded-xl" onClick={() => alert("Evolução salva no dossiê! 🥋")}>
                    Adicionar Evolução
                  </Button>
                </div>

                {/* Timeline de Graduações */}
                {selectedStudent.graduationHistory && selectedStudent.graduationHistory.length > 0 && (
                   <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-foreground tracking-tight">
                        <Award className="h-4 w-4 text-amber-500" />
                        Histórico de Graduações
                      </h4>
                      <div className="relative pl-6 border-l-2 border-primary/20 space-y-4">
                         {selectedStudent.graduationHistory.slice().reverse().map((g, idx) => (
                            <div key={idx} className="relative">
                               <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background shadow-sm" />
                               <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                                  <p className="text-xs text-muted-foreground font-medium">
                                     {new Date(g.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </p>
                                  <p className="text-sm font-bold mt-1">
                                     <span className="text-muted-foreground">Faixa</span>{' '}
                                     <span className="uppercase">{g.fromBelt}</span>
                                     <span className="text-primary mx-2">→</span>
                                     <span className="uppercase text-primary font-black">{g.toBelt}</span>
                                  </p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
                
                <div className="pt-4 border-t border-border/50">
                   <Button 
                     variant="secondary"
                     size="lg" 
                     className="w-full bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-500/20 shadow-sm transition-all rounded-xl relative overflow-hidden group"
                     onClick={() => {
                        handleMarkAsReady(selectedStudent.id, selectedStudent.name)
                     }}
                   >
                     <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                     <Award className="mr-2 h-5 w-5" />
                     <span className="font-bold tracking-tight">Avalizar Apto p/ Exame</span>
                   </Button>
                   <p className="text-center text-[10px] text-muted-foreground mt-3 leading-tight opacity-70">
                     Dar Aval envia esse aluno para o Painel de Graduação como apto (independente de % de horas) para submeter-se à mudança de faixa por um Gestor homologado.
                   </p>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
