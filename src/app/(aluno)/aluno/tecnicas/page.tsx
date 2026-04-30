"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookOpen, Swords } from "lucide-react";
import { useState } from "react";
import { StudentTechnique } from "@/lib/types";

export default function TecnicasPage() {
  const { academy } = useAcademy();
  const { user } = useUser();
  const { students, studentTechniques, isLoading } = useApi(academy?.id);
  const [selectedTech, setSelectedTech] = useState<StudentTechnique | null>(null);

  const student = user?.primaryEmailAddress?.emailAddress 
    ? students.find(s => s.email === user.primaryEmailAddress!.emailAddress) || students[0]
    : students.length > 0 ? students[0] : null;

  if (!academy || isLoading) return null;
  if (!student) return <div className="p-4 text-center">Aluno não encontrado no banco de dados.</div>;

  const myTechniques = studentTechniques
    .filter(t => t.studentId === student.id)
    .sort((a, b) => new Date(b.learnedAt).getTime() - new Date(a.learnedAt).getTime());

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-primary" />
          Biblioteca de Golpes
        </h2>
        <p className="text-sm text-muted-foreground">Todas as técnicas aprendidas no tatame.</p>
      </div>

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
                     <p className="font-bold text-foreground text-sm truncate mb-0.5">{tech.name}</p>
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
           <div className="glass-card rounded-xl p-6 text-center border-0 mt-4">
             <p className="text-sm text-muted-foreground font-medium">Nenhum golpe na sua biblioteca.</p>
             <p className="text-xs text-muted-foreground mt-1">Seu professor adicionará as técnicas que você aprender! 🥋</p>
           </div>
        )}
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
                {selectedTech.category && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">{selectedTech.category}</Badge>
                )}
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
    </div>
  );
}
