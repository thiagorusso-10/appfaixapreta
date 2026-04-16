"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { apiMock } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Search, User, Activity } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";

export default function ProfessorAlunosPage() {
  const { academy } = useAcademy();
  const [searchTerm, setSearchTerm] = useState("");

  if (!academy) return null;

  const students = apiMock.getStudentsByAcademy(academy.id);
  
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Fichas de Alunos</h1>
        <p className="text-sm text-muted-foreground mt-1">Consulte o prontuário e histórico técnico dos praticantes.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar aluno por nome..." 
          className="pl-9 rounded-xl bg-card border-border/50 shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
           <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno encontrado.</p>
        ) : (
           filteredStudents.map(student => (
              <Sheet key={student.id}>
                 <SheetTrigger className="w-full text-left">
                    <div className="glass-card p-4 rounded-xl border border-border/40 flex flex-col gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                       <div className="flex items-center gap-3">
                          {student.avatarUrl ? (
                             <img src={student.avatarUrl} alt="Foto" className="h-12 w-12 rounded-xl object-cover" />
                          ) : (
                             <div className="h-12 w-12 bg-secondary flex items-center justify-center rounded-xl text-muted-foreground font-bold">
                                {student.name.charAt(0)}
                             </div>
                          )}
                          <div className="flex flex-col">
                             <span className="font-semibold text-foreground">{student.name}</span>
                             <div className="flex items-center gap-2 mt-0.5">
                               <Badge variant="outline" className="text-[10px] py-0">{student.beltRank}</Badge>
                               <span className="text-xs text-muted-foreground">{(student as any).age || 25} anos</span>
                             </div>
                          </div>
                          {student.medicalRestrictions && (
                             <Activity className="h-4 w-4 text-red-500 ml-auto" />
                          )}
                       </div>
                    </div>
                 </SheetTrigger>
                 <SheetContent side="bottom" className="h-[85vh] sm:h-full sm:side-right sm:max-w-md w-full rounded-t-3xl sm:rounded-none p-0 border-none shadow-2xl glass-card flex flex-col">
                    <SheetHeader className="p-6 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-2 bg-primary/40" />
                       <SheetTitle className="text-left text-2xl flex items-center gap-3">
                         {student.avatarUrl ? (
                             <img src={student.avatarUrl} alt="Foto" className="h-16 w-16 rounded-xl object-cover shadow-sm" />
                          ) : (
                             <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-bold text-xl">
                                {student.name.charAt(0)}
                             </div>
                          )}
                         <div className="flex flex-col">
                           <span>{student.name}</span>
                           <span className="text-sm font-medium text-muted-foreground mt-1">Faixa {student.beltRank}</span>
                         </div>
                       </SheetTitle>
                    </SheetHeader>
                    
                    <div className="p-6 overflow-y-auto space-y-6">
                       <div className="space-y-2">
                          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 text-foreground">
                             <User className="h-4 w-4 text-primary" /> Dados do Aluno
                          </h4>
                          <div className="bg-muted/30 p-4 rounded-xl space-y-2 text-sm border border-border/40">
                             <div className="flex justify-between"><span className="text-muted-foreground">E-mail:</span> <span className="font-medium text-foreground">{student.email}</span></div>
                             <div className="flex justify-between"><span className="text-muted-foreground">Telefone:</span> <span className="font-medium text-foreground">(11) 99999-9999</span></div>
                             <div className="flex justify-between"><span className="text-muted-foreground">Modalidade:</span> <span className="font-medium text-foreground">{student.modality}</span></div>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 text-red-500">
                             <Activity className="h-4 w-4" /> Prontuário Médico
                          </h4>
                          <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                             <p className="text-sm text-red-600/90 leading-relaxed font-medium">
                               {student.medicalRestrictions || "Nenhuma restrição identificada. Apto para treinos intensos."}
                             </p>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 text-primary">
                             Progresso Técnico
                          </h4>
                          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                             <div className="flex justify-between text-sm">
                               <span className="text-muted-foreground">Última Graduação:</span> 
                               <span className="font-medium text-foreground">{new Date(student.lastGraduationDate).toLocaleDateString('pt-BR')}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                               <span className="text-muted-foreground">Aulas (Atual):</span> 
                               <span className="font-bold text-primary">{student.classesAttendedToNextRank} / {student.classesTargetForNextRank}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </SheetContent>
              </Sheet>
           ))
        )}
      </div>
    </div>
  );
}
