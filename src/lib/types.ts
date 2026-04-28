export enum UserRole {
  ADMIN = "ADMIN",
  PROFESSOR = "PROFESSOR",
  ALUNO = "ALUNO",
}

export enum BeltRank {
  BRANCA = "Branca",
  CINZA = "Cinza",
  AZUL = "Azul",
  AMARELA = "Amarela",
  LARANJA = "Laranja",
  VERDE = "Verde",
  ROXA = "Roxa",
  MARROM = "Marrom",
  PRETA = "Preta",
}

export type PaymentStatus = "PAGO" | "ATRASADO" | "PENDENTE";
export type PaymentMethod = "PIX" | "CARTÃO";
export type StudentStatus = "ATIVO" | "INATIVO";

export interface Academy {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColorHex: string;
  documentNumber: string; // CNPJ ou CPF
  pixKey?: string; // Chave PIX para pagamentos
}

export interface User {
  id: string;
  academyId: string;
  name: string;
  email?: string; // Facultativo para crianças
  role: UserRole;
  avatarUrl?: string;
}

export interface Student extends User {
  role: UserRole.ALUNO;
  beltRank: BeltRank;
  lastGraduationDate: string; // ISO String
  modality: string;
  status: StudentStatus;
  medicalRestrictions?: string;
  professorNotes?: string;
  checkinBlocked?: boolean;
  checkinBlockReason?: string;
  classesAttendedToNextRank: number;
  classesTargetForNextRank: number;
  // Novos campos:
  birthDate?: string; // ISO String para base de cálculos de categoria/idade
  weight?: string;
  phone?: string;
  guardianName?: string; // Obrigatório psicologicamente se for criança
  guardianPhone?: string;
  isExemptFromPayment?: boolean; // Crianças ou bolsistas
  isReadyForExam?: boolean; // Aval do professor (override de meta)
  beltDegree?: number; // Grau dentro da faixa (0-4). Ex: Cinza 2º grau = beltRank:CINZA + beltDegree:2
  planId?: string; // ID do Plano Comercial Assinado
  graduationHistory?: Array<{ date: string; fromBelt: string; toBelt: string }>; // Timeline de faixas
  turmaId?: string; // ID da Turma a qual este aluno pertence
}

export interface Turma {
  id: string;
  academyId: string;
  name: string;
  schedule?: string;
  professor?: string;
}

export interface Plan {
  id: string;
  academyId: string;
  name: string;
  price: number;
  recurring: boolean;
  description?: string;
  features?: string[];
  classesPerWeek?: string;
  defaultBillingDay?: number;
  isPopular?: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  academyId: string;
  amount: number;
  dueDate: string; // ISO String
  paidDate?: string; // ISO String
  status: PaymentStatus;
  method: PaymentMethod;
  planId?: string;
  description?: string;
}

export interface Expense {
  id: string;
  academyId: string;
  description: string;
  amount: number;
  dueDate: string; // ISO String
  status: PaymentStatus;
  category: "FIXA" | "VARIÁVEL";
}

export interface Technique {
  id: string;
  academyId: string;
  name: string;
  description: string;
  videoUrl?: string;
  difficultyLevel: "Iniciante" | "Intermediário" | "Avançado";
}

export interface ClassSession {
  id: string;
  academyId: string;
  modality: string;
  level: "Kids" | "Iniciante" | "Avançado" | "Todos";
  time: string; // "19:00" ou "19:00 - 20:30"
  weekDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Domingo
  maxStudents: number;
  professorId?: string;
  techniqueOfTheDayId?: string;
}

export interface CheckIn {
  id: string;
  studentId: string;
  classSessionId: string;
  timestamp: string; // ISO String
}

export interface AppNotification {
  id: string;
  studentId: string;
  title: string;
  description: string;
  timestamp: string; // ISO String
  read: boolean;
  type: "PAYMENT" | "EVENT" | "INFO";
}

export interface LessonPlan {
  id: string;
  academyId: string;
  turmaId?: string; // Alterado de classSessionId para vincular a nova estrutura de turmas
  classSessionId?: string; // Antigo
  date: string; // ISO String (ex: 2026-03-10)
  title: string;
  content: string; // Sequência Didática, Markdown suportado no futuro
  observations?: string;
  createdAt: string; // ISO String
}

export interface StudentTechnique {
  id: string;
  academyId: string;
  studentId: string;
  name: string;
  imageUrl?: string;
  category?: string;
  learnedAt: string; // ISO String ou Date YYYY-MM-DD
  notes?: string;
  createdAt: string; // ISO String
}
