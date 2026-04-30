"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Swords, Plus, Trash2, Search, Loader2, Image as ImageIcon, Users, ChevronDown, ChevronUp, X, Edit } from "lucide-react";
import { useState } from "react";
import { StudentTechnique } from "@/lib/types";

interface GroupedTechnique {
  name: string;
  category?: string;
  imageUrl?: string;
  learnedAt: string;
  students: { id: string; techId: string; name: string; avatarUrl?: string }[];
}

export default function TecnicasGestorPage() {
  const { academy } = useAcademy();
  const { students, turmas, studentTechniques, createStudentTechnique, createMultipleStudentTechniques, updateMultipleStudentTechniques, deleteStudentTechnique, uploadTechniqueImage, isLoading } = useApi(academy?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<GroupedTechnique | null>(null);
  
  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTechnique = async (e: React.FormEvent) => {
    e.preventDefault();
    // Na edição, não validamos selectedStudentId pois o grupo de alunos já está definido
    if (!name || (!editingGroup && !selectedStudentId)) {
      alert("Selecione os alunos e informe o nome do golpe.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const uploadedUrl = await uploadTechniqueImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      if (editingGroup) {
         // Se estamos editando, atualizamos todos os registros desse grupo (baseado nos IDs coletados)
         const idsToUpdate = editingGroup.students.map(s => s.techId);
         await updateMultipleStudentTechniques(idsToUpdate, {
            name,
            category,
            notes,
            imageUrl: imageUrl || editingGroup.imageUrl,
         });
      } else {
         let targetStudents: string[] = [];
         if (selectedStudentId === "ALL") {
            targetStudents = students.map(s => s.id);
         } else if (selectedStudentId.startsWith("TURMA_")) {
            const turmaId = selectedStudentId.replace("TURMA_", "");
            targetStudents = students.filter(s => s.turmaId === turmaId).map(s => s.id);
         } else {
            targetStudents = [selectedStudentId];
         }

         if (targetStudents.length === 0) {
            alert("Nenhum aluno encontrado na seleção!");
            setIsSubmitting(false);
            return;
         }

         if (targetStudents.length === 1) {
            await createStudentTechnique({
               studentId: targetStudents[0],
               name,
               category,
               notes,
               imageUrl,
            });
         } else {
            const payload = targetStudents.map(id => ({
               studentId: id,
               name,
               category,
               notes,
               imageUrl,
            }));
            await createMultipleStudentTechniques(payload);
         }
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedStudentId("");
    setName("");
    setCategory("");
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
    setEditingGroup(null);
  };

  const openEditModal = (group: GroupedTechnique) => {
    setEditingGroup(group);
    setName(group.name);
    setCategory(group.category || "");
    setImagePreview(group.imageUrl || null);
    // Para notas, pegamos a nota da primeira técnica do grupo como base
    const firstTechId = group.students[0]?.techId;
    const firstTech = studentTechniques.find(t => t.id === firstTechId);
    setNotes(firstTech?.notes || "");
    setIsDialogOpen(true);
  };

  if (!academy || isLoading) return null;

  // Agrupa técnicas pelo nome+categoria (evita repetição visual)
  const grouped: GroupedTechnique[] = [];
  studentTechniques.forEach(t => {
    const student = students.find(s => s.id === t.studentId);
    if (!student) return;
    
    const key = `${t.name}___${t.category || ''}`;
    let group = grouped.find(g => `${g.name}___${g.category || ''}` === key);
    
    if (!group) {
      group = {
        name: t.name,
        category: t.category,
        imageUrl: t.imageUrl,
        learnedAt: t.learnedAt,
        students: [],
      };
      grouped.push(group);
    }
    group.students.push({
      id: student.id,
      techId: t.id,
      name: student.name,
      avatarUrl: student.avatarUrl,
    });
  });

  const filteredGroups = grouped.filter(g => {
    const searchLow = searchTerm.toLowerCase();
    return g.name.toLowerCase().includes(searchLow) ||
           (g.category?.toLowerCase() || "").includes(searchLow) ||
           g.students.some(s => s.name.toLowerCase().includes(searchLow));
  });

  const handleDeleteTechnique = async (techId: string, groupKey: string) => {
    if (confirm("Remover esta técnica deste aluno?")) {
      await deleteStudentTechnique(techId);
    }
  };

  const handleDeleteAllInGroup = async (group: GroupedTechnique) => {
    if (confirm(`Tem certeza que deseja remover "${group.name}" de TODOS os ${group.students.length} alunos?`)) {
      for (const s of group.students) {
        await deleteStudentTechnique(s.techId);
      }
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Swords className="h-8 w-8 text-primary" />
            Técnicas Aprendidas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Catálogo de golpes ensinados na academia, agrupados por técnica.
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
          className="shadow-lg shadow-primary/20 rounded-xl px-6"
        >
          <Plus className="mr-2 h-4 w-4" /> Cadastrar Golpe
        </Button>
      </div>

      {/* Barra de busca */}
      <div className="flex bg-card p-2 rounded-xl border border-border shadow-sm max-w-sm">
        <div className="flex items-center pl-3 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input 
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent" 
          placeholder="Buscar por golpe, categoria ou aluno..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista agrupada */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredGroups.map((group) => {
          const groupKey = `${group.name}___${group.category || ''}`;
          const isExpanded = expandedGroup === groupKey;

          return (
            <Card key={groupKey} className="overflow-hidden border-0 glass-card transition-all hover:shadow-xl hover:shadow-primary/5 relative group">
              {/* Imagem da técnica */}
              {group.imageUrl ? (
                <div 
                  className="h-36 w-full overflow-hidden bg-muted cursor-pointer relative"
                  onClick={() => setPreviewImage(group.imageUrl!)}
                >
                  <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
              ) : (
                <div className="h-28 w-full bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary/20">
                  <Swords className="h-10 w-10" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity z-10">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border-none shadow-sm text-primary hover:bg-primary hover:text-white"
                  onClick={(e) => { e.stopPropagation(); openEditModal(group); }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-red-500/80 backdrop-blur-sm border-none shadow-sm hover:bg-red-600"
                  onClick={(e) => { e.stopPropagation(); handleDeleteAllInGroup(group); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-5">
                {/* Header: Categoria + Data */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {group.category && (
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-none">
                      {group.category}
                    </Badge>
                  )}
                </div>

                {/* Nome do golpe */}
                <h3 className="font-bold text-xl leading-tight mb-3">{group.name}</h3>

                {/* Contador de alunos */}
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : groupKey)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {group.students.length} {group.students.length === 1 ? 'aluno' : 'alunos'}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Lista expansível de alunos */}
                {isExpanded && (
                  <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {group.students.map(s => (
                      <div key={s.techId} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors group/item">
                        <div className="flex items-center gap-2 min-w-0">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} className="h-7 w-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold shrink-0">
                              {s.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm text-foreground truncate">{s.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                          onClick={() => handleDeleteTechnique(s.techId, groupKey)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Botão de apagar todos */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-xs"
                      onClick={() => handleDeleteAllInGroup(group)}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Remover de todos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl">
             <Swords className="h-8 w-8 mx-auto mb-3 opacity-20" />
             <p>Nenhuma técnica encontrada.</p>
          </div>
        )}
      </div>

      {/* Modal Preview de Imagem */}
      <Dialog open={!!previewImage} onOpenChange={(o) => !o && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-0 rounded-2xl bg-black/90">
          {previewImage && (
            <img src={previewImage} alt="Técnica" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Formulário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveTechnique}>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "Editar Técnica" : "Adicionar Nova Técnica"}</DialogTitle>
              <DialogDescription>
                {editingGroup 
                  ? `Atualizando os dados do golpe "${editingGroup.name}" para todos os alunos selecionados.`
                  : "Registre um golpe novo e atribua aos alunos individualmente, por turma ou para toda a academia."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingGroup && (
                <div className="grid gap-2">
                  <Label>Aplicar à</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                  >
                    <option value="">Selecione quem irá receber...</option>
                    
                    <optgroup label="Coletivo">
                       <option value="ALL">📢 Todos os Alunos da Academia</option>
                       {turmas.map(t => (
                          <option key={`TURMA_${t.id}`} value={`TURMA_${t.id}`}>🏷️ Turma: {t.name}</option>
                       ))}
                    </optgroup>
                    
                    <optgroup label="Individual">
                      {students.map(s => (
                         <option key={s.id} value={s.id}>{s.name} - Faixa {s.beltRank}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Nome do Golpe</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: O-soto-gari" required />
              </div>
              <div className="grid gap-2">
                <Label>Categoria ou Grupo (Opcional)</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Chão, Go Kyo 1º Grau" />
              </div>
              <div className="grid gap-2">
                <Label>Imagem (Opcional)</Label>
                <div className="flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-xl border border-dashed border-border overflow-hidden bg-muted/30 flex items-center justify-center shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="tech-img" className="inline-block text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
                      Enviar Foto
                    </label>
                    <input id="tech-img" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Anotações do Professor</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Prestar atenção na pegada da gola" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
