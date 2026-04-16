import { 
  Academy, 
  User, 
  Student, 
  BeltRank, 
  UserRole, 
  Plan, 
  Payment, 
  ClassSession, 
  Technique,
  CheckIn,
  AppNotification
} from "./types";

export const academiesMock: Academy[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Judo ECNA",
    primaryColorHex: "#3B82F6", // Tailwind blue-500
    documentNumber: "12345678000199",
  },
  {
    id: "a2",
    name: "Gracie X",
    primaryColorHex: "#EF4444", // Tailwind red-500
    documentNumber: "98765432000111",
  }
];

export const adminsMock: User[] = [
  {
    id: "admin1",
    academyId: "a1",
    name: "Mestre Silva",
    email: "silva@dojo.com",
    role: UserRole.ADMIN,
    avatarUrl: "https://i.pravatar.cc/150?u=admin1"
  },
  {
    id: "admin2",
    academyId: "a2",
    name: "Mestre Gracie",
    email: "gracie@x.com",
    role: UserRole.ADMIN,
    avatarUrl: "https://i.pravatar.cc/150?u=admin2"
  }
];

export const studentsMock: Student[] = [
  // Dojo Silva Students
  {
    id: "s1",
    academyId: "a1",
    name: "Lucas Pereira",
    email: "lucas@example.com",
    role: UserRole.ALUNO,
    beltRank: BeltRank.AZUL,
    lastGraduationDate: "2025-01-10T10:00:00Z",
    modality: "Jiu-Jitsu",
    status: "ATIVO",
    classesAttendedToNextRank: 35,
    classesTargetForNextRank: 30,
    avatarUrl: "https://i.pravatar.cc/150?u=s1"
  },
  {
    id: "s2",
    academyId: "a1",
    name: "Marina Costa",
    email: "marina@example.com",
    role: UserRole.ALUNO,
    beltRank: BeltRank.BRANCA,
    lastGraduationDate: "2025-10-15T10:00:00Z",
    modality: "Jiu-Jitsu",
    status: "ATIVO",
    medicalRestrictions: "Asma",
    classesAttendedToNextRank: 10,
    classesTargetForNextRank: 30,
    avatarUrl: "https://i.pravatar.cc/150?u=s2"
  },
  {
    id: "s3",
    academyId: "a1",
    name: "João Santos (Evadido)",
    email: "joao@example.com",
    role: UserRole.ALUNO,
    beltRank: BeltRank.AMARELA,
    lastGraduationDate: "2025-05-10T10:00:00Z",
    modality: "Jiu-Jitsu",
    status: "INATIVO",
    classesAttendedToNextRank: 2,
    classesTargetForNextRank: 30,
  },
  // Gracie X Students
  {
    id: "s4",
    academyId: "a2",
    name: "Fernanda Lima",
    email: "fernanda@example.com",
    role: UserRole.ALUNO,
    beltRank: BeltRank.ROXA,
    lastGraduationDate: "2024-11-20T10:00:00Z",
    modality: "Jiu-Jitsu",
    status: "ATIVO",
    classesAttendedToNextRank: 60,
    classesTargetForNextRank: 80,
    avatarUrl: "https://i.pravatar.cc/150?u=s4"
  },
  {
    id: "s5",
    academyId: "a2",
    name: "Carlos Almeida",
    email: "carlos@example.com",
    role: UserRole.ALUNO,
    beltRank: BeltRank.BRANCA,
    lastGraduationDate: "2026-01-05T10:00:00Z",
    modality: "Jiu-Jitsu",
    status: "ATIVO",
    classesAttendedToNextRank: 28,
    classesTargetForNextRank: 30, // Quase apto para graduar
  },
  {
    id: "s6",
    academyId: "a2",
    name: "Enzo Gabriel",
    role: UserRole.ALUNO,
    beltRank: BeltRank.CINZA,
    lastGraduationDate: "2025-08-10T10:00:00Z",
    modality: "Jiu-Jitsu",
    status: "ATIVO",
    classesAttendedToNextRank: 15,
    classesTargetForNextRank: 30,
    birthDate: "2016-04-12",
    isExemptFromPayment: true,
    guardianName: "Rodrigo Matos",
    guardianPhone: "(21) 98888-7777"
  }
];

export const plansMock: Plan[] = [
  { 
    id: "p1", academyId: "a1", name: "Mensal Básico", price: 150.00, recurring: true,
    description: "Ideal para iniciantes no tatame e alunos regulares da semana que buscam saúde e bem-estar.",
    features: ["Acesso a 3 aulas semanais", "Defesa Pessoal", "Direito a participar dos eventos de exame"],
    classesPerWeek: "3x", defaultBillingDay: 10, isPopular: true
  },
  { 
    id: "p2", academyId: "a1", name: "Anual Competidor", price: 1200.00, recurring: true,
    description: "Pacote agressivo para quem viaja competindo e pratica Jiu-Jitsu diariamente no Dojo.",
    features: ["Acesso Ilimitado de Seg a Sab", "Preparação Física inclusa na grade", "Inscrição Copa Interna 0800"],
    classesPerWeek: "Livre", defaultBillingDay: 5, isPopular: false
  },
];

export const paymentsMock: Payment[] = [
  // Dojo Silva
  { id: "pay1", academyId: "a1", studentId: "s1", amount: 150.00, dueDate: "2026-03-10T23:59:59Z", status: "PAGO", method: "PIX", planId: "p1" },
  { id: "pay2", academyId: "a1", studentId: "s2", amount: 150.00, dueDate: "2026-03-05T23:59:59Z", status: "ATRASADO", method: "CARTÃO", planId: "p1" },
  { id: "pay3", academyId: "a1", studentId: "s3", amount: 150.00, dueDate: "2026-02-10T23:59:59Z", status: "ATRASADO", method: "PIX", planId: "p1" },
  // Gracie X
  { id: "pay4", academyId: "a2", studentId: "s4", amount: 400.00, dueDate: "2026-03-15T23:59:59Z", status: "PENDENTE", method: "CARTÃO", planId: "p2" },
  { id: "pay5", academyId: "a2", studentId: "s5", amount: 400.00, dueDate: "2026-01-15T23:59:59Z", status: "PAGO", method: "PIX", planId: "p2" },
];

export const techniquesMock: Technique[] = [
  { id: "t1", academyId: "a1", name: "Armlock da Guarda", description: "Chave de braço partindo da guarda fechada.", difficultyLevel: "Iniciante", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: "t2", academyId: "a1", name: "Triângulo", description: "Estrangulamento com as pernas.", difficultyLevel: "Intermediário" },
  { id: "t3", academyId: "a2", name: "Kimura do Cem Quilos", description: "Chave de ombro.", difficultyLevel: "Iniciante" }
];

export const classSessionsMock: ClassSession[] = [
  { id: "c1", academyId: "a1", modality: "Jiu-Jitsu", level: "Iniciante", scheduleTime: "19:00 - 20:30", weekDay: 1, maxStudents: 20, professorId: "admin1", techniqueOfTheDayId: "t1" } as any,
  { id: "c2", academyId: "a1", modality: "Jiu-Jitsu", level: "Avançado", scheduleTime: "20:30 - 22:00", weekDay: 1, maxStudents: 20, professorId: "admin1", techniqueOfTheDayId: "t2" } as any,
  { id: "c3", academyId: "a2", modality: "Jiu-Jitsu", level: "Todos", scheduleTime: "18:00 - 19:30", weekDay: 3, maxStudents: 30, professorId: "admin2", techniqueOfTheDayId: "t3" } as any,
];

export const checkInsMock: CheckIn[] = [
  { id: "chk1", studentId: "s1", classSessionId: "c2", timestamp: "2026-03-09T19:25:00Z" },
  { id: "chk2", studentId: "s2", classSessionId: "c1", timestamp: "2026-03-09T18:50:00Z" },
  { id: "chk3", studentId: "s4", classSessionId: "c3", timestamp: "2026-03-11T17:55:00Z" },
];

export const notificationsMock: AppNotification[] = [
  { id: "not1", studentId: "s1", title: "Campeonato Interno", description: "Inscrições abertas para o Regional 2026. Garanta a sua vaga!", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false, type: "EVENT" },
  { id: "not2", studentId: "s2", title: "Mensalidade Atrasada", description: "Verificamos uma pendência em seu cadastro. Regularize para não perder aulas.", timestamp: new Date(Date.now() - 86400000).toISOString(), read: false, type: "PAYMENT" },
  { id: "not3", studentId: "s1", title: "Aviso do Dojo", description: "Não haverá aula no feriado de sexta-feira, o dojô estará dedetizando.", timestamp: new Date(Date.now() - 172800000).toISOString(), read: true, type: "INFO" },
  { id: "not4", studentId: "s4", title: "Exame de Faixa Próximo!", description: "Você está quase batendo sua meta de aulas para trocar de faixa. Siga firme!", timestamp: new Date(Date.now() - 43200000).toISOString(), read: false, type: "INFO" }
];

// === Planos de Aula (Fase 16) ===
export interface LessonPlan {
  id: string;
  academyId: string;
  classSessionId: string;
  date: string;
  title: string;
  content: string;
  observations: string;
  createdAt: string;
}

export const lessonPlansMock: LessonPlan[] = [
  {
    id: "lp1", academyId: "a1", classSessionId: "c1",
    date: "2026-03-17",
    title: "Armlock da Guarda Fechada",
    content: "1. Aquecimento com mobilidade de quadril (10min)\n2. Demonstração do Armlock clássico partindo da guarda fechada\n3. Drills em dupla: Quebra de postura → Controle de braço → Finalização\n4. Randori posicional de 3min (só ataque de braço)",
    observations: "Focar nos alunos brancos que ainda não dominam o controle de quadril.",
    createdAt: "2026-03-16T22:00:00Z"
  },
  {
    id: "lp2", academyId: "a1", classSessionId: "c3",
    date: "2026-03-15",
    title: "Passagem de Guarda Toreando",
    content: "1. Aquecimento padrão (corridinha, rolamento)\n2. Revisão: Controle de lapela e manga\n3. Técnica principal: Toreando grip → Pressão lateral → Side Control\n4. Sparring 5x5 livre",
    observations: "Turma avançada — pode subir a intensidade do sparring.",
    createdAt: "2026-03-14T21:30:00Z"
  },
  {
    id: "lp3", academyId: "a1", classSessionId: "c1",
    date: "2026-03-10",
    title: "Raspagem tipo Tesoura",
    content: "1. Aquecimento com drills de guarda\n2. Demonstração da raspagem tesoura\n3. Repetição em pares (4 séries de 5 reps cada lado)\n4. Randori posicional: guarda vs passagem",
    observations: "",
    createdAt: "2026-03-09T20:00:00Z"
  }
];
// Funções Helpers Auxiliares (Simulando um ORM / SDK)
export const apiMock = {
  getAcademyById: (id: string) => academiesMock.find(a => a.id === id) || null,
  getStudentsByAcademy: (academyId: string) => studentsMock.filter(s => s.academyId === academyId),
  getPaymentsByAcademy: (academyId: string) => paymentsMock.filter(p => p.academyId === academyId),
  getClassesByAcademy: (academyId: string) => classSessionsMock.filter(c => c.academyId === academyId),
  getClassesForStudent: (student: Student) => classSessionsMock.filter(c => c.academyId === student.academyId && (c.level === 'Todos' || (student.beltRank === BeltRank.BRANCA ? c.level === 'Iniciante' : c.level === 'Avançado'))),

  updateStudentsPlan: (academyId: string, planId: string, studentIds: string[]) => {
    studentsMock.forEach(s => {
      if (s.academyId === academyId) {
        if (studentIds.includes(s.id)) {
           s.planId = planId;
        } else if (s.planId === planId) {
           s.planId = undefined;
        }
      }
    });
  },

  // Gestão de Turmas/Grade (Fase 15)
  upsertClassSession: (session: typeof classSessionsMock[0]) => {
    const index = classSessionsMock.findIndex(s => s.id === session.id);
    if (index !== -1) {
      classSessionsMock[index] = { ...classSessionsMock[index], ...session };
    } else {
      classSessionsMock.unshift(session);
    }
  },
  deleteClassSession: (sessionId: string) => {
    const index = classSessionsMock.findIndex(s => s.id === sessionId);
    if (index !== -1) classSessionsMock.splice(index, 1);
  },
  updateClassTechnique: (sessionId: string, techniqueName: string) => {
    const session = classSessionsMock.find(s => s.id === sessionId);
    if (session) session.techniqueOfTheDayId = techniqueName;
  },

  // === Plano de Aula (Fase 16) ===
  addLessonPlan: (plan: { id: string; academyId: string; classSessionId: string; date: string; title: string; content: string; observations: string; createdAt: string }) => {
    lessonPlansMock.unshift(plan);
  },
  getLessonPlansByAcademy: (academyId: string) => {
    return lessonPlansMock
      .filter(p => p.academyId === academyId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  deleteLessonPlan: (planId: string) => {
    const idx = lessonPlansMock.findIndex(p => p.id === planId);
    if (idx !== -1) lessonPlansMock.splice(idx, 1);
  },
  updateLessonPlan: (planId: string, updates: Partial<LessonPlan>) => {
    const idx = lessonPlansMock.findIndex(p => p.id === planId);
    if (idx !== -1) {
      lessonPlansMock[idx] = { ...lessonPlansMock[idx], ...updates };
    }
  },

  getStudentCheckIns: (studentId: string) => checkInsMock.filter(c => c.studentId === studentId),
  getNotificationsByStudent: (studentId: string) => notificationsMock.filter(n => n.studentId === studentId),
  
  // === Financeiro (Fase 18) ===
  addPayment: (payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: `pay_${Date.now()}` } as Payment;
    paymentsMock.unshift(newPayment);
    return newPayment;
  },
  markPaymentAsPaid: (paymentId: string) => {
    const payment = paymentsMock.find(p => p.id === paymentId);
    if (payment) payment.status = "PAGO";
  },
  deletePayment: (paymentId: string) => {
    const idx = paymentsMock.findIndex(p => p.id === paymentId);
    if (idx !== -1) paymentsMock.splice(idx, 1);
  },
  generateMonthlyInvoices: (academyId: string, month: number, year: number, baseAmount: number) => {
    const activeStudents = studentsMock.filter(s => s.academyId === academyId && s.status === "ATIVO" && !s.isExemptFromPayment);
    let count = 0;
    
    activeStudents.forEach(student => {
      // Checar se o aluno ja possui lançamento no mês/ano
      const hasInvoice = paymentsMock.some(p => {
        if (p.studentId !== student.id) return false;
        const d = new Date(p.dueDate);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      
      if (!hasInvoice) {
        // Gerar para o dia 10 do mês (T12:00:00 para forçar meio dia e nao bugar timezone UTC ao exibir na tabela)
        const dtStr = `${year}-${String(month + 1).padStart(2, '0')}-10T12:00:00`;
        const vencimento = new Date(dtStr);
        let status = "PENDENTE";
        
        // Se a data que estou gerando já passou de hj, nasce atrasado.
        if (vencimento.getTime() < new Date().getTime() - 86400000) {
          status = "ATRASADO";
        }
        
        paymentsMock.unshift({
          id: `pay_batch_${Date.now()}_${student.id}`,
          academyId,
          studentId: student.id,
          amount: baseAmount,
          dueDate: vencimento.toISOString(),
          status: status as any,
          method: "PIX", // default
          description: `Mensalidade ${String(month + 1).padStart(2, '0')}/${year}`
        });
        count++;
      }
    });
    return count;
  },

  // Ações de Estado (Regras de Negócio)
  checkInStudent: (studentId: string, classSessionId: string) => {
    const student = studentsMock.find(s => s.id === studentId);
    if (!student) throw new Error("Atleta não encontrado no sistema.");

    // 1. Verificar pendência financeira (aviso, NÃO bloqueia)
    let warning: string | undefined;
    if (!student.isExemptFromPayment) {
      const pendingPayments = paymentsMock.filter(p => p.studentId === studentId && p.status === 'ATRASADO');
      if (pendingPayments.length > 0) {
        warning = `⚠️ ${student.name} possui mensalidade(s) em atraso. Orientar sobre regularização.`;
      }
    }
    
    // 2. Contabilizar Presença / Gamificação (SEMPRE, mesmo com atraso)
    student.classesAttendedToNextRank += 1;
    
    const newCheckIn: CheckIn = {
      id: `chk_${Date.now()}`,
      studentId,
      classSessionId,
      timestamp: new Date().toISOString()
    };
    checkInsMock.push(newCheckIn);
    
    return { checkIn: newCheckIn, warning, student };
  },

  promoteStudent: (studentId: string) => {
    const student = studentsMock.find(s => s.id === studentId);
    if (!student) throw new Error("Atleta não encontrado no sistema.");

    const ranks = Object.values(BeltRank);
    const currentIndex = ranks.indexOf(student.beltRank);

    if (currentIndex < ranks.length - 1) {
       // Promote to Next Rank
       student.beltRank = ranks[currentIndex + 1];
    }
    
    // Histórico cumulativo (aulas não são zeradas até o fim do ano letivo por ordem do Sensei)
    student.lastGraduationDate = new Date().toISOString();
    student.isReadyForExam = false; // Tira ele da fila pós-exame

    // Escalonar Target de Meta garantindo que ele perca o status de "Apto por Horas" após Promovido
    student.classesTargetForNextRank += 30;

    return student;
  },

  markAsApto: (studentId: string) => {
    const student = studentsMock.find(s => s.id === studentId);
    if (!student) throw new Error("Atleta não encontrado.");
    student.isReadyForExam = true;
    return student;
  },

  upsertStudent: (student: typeof studentsMock[0]) => {
    const index = studentsMock.findIndex(s => s.id === student.id);
    if (index !== -1) {
      studentsMock[index] = { ...studentsMock[index], ...student };
    } else {
      studentsMock.unshift(student); // Joga pro topo do stack
    }
  }
};
