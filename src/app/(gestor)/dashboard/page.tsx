"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { BeltRank, UserRole, type Student } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Users, UserMinus, DollarSign, AlertCircle, TrendingUp, Activity, Award, UserCheck, Smartphone, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useEffect, useState } from "react";

const BELT_COLORS: Record<string, string> = {
  [BeltRank.BRANCA]: "#e2e8f0",
  [BeltRank.CINZA]: "#94a3b8",
  [BeltRank.AZUL]: "#3b82f6",
  [BeltRank.AMARELA]: "#eab308",
  [BeltRank.LARANJA]: "#f97316",
  [BeltRank.VERDE]: "#22c55e",
  [BeltRank.ROXA]: "#a855f7",
  [BeltRank.MARROM]: "#92400e",
  [BeltRank.PRETA]: "#0f172a",
};

export default function DashboardPage() {
  const { academy } = useAcademy();
  const [mounted, setMounted] = useState(false);

  // Injeta a API real que se conecta via Clerk JWT com o Supabase RLS
  const { students, payments, checkins, expenses, isLoading } = useApi(academy?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!academy || !mounted || isLoading) return null;

  // ==== 1. BUSCA DE DADOS VIVOS (BANCO REAL) ====
  const activeStudents = students.filter(s => s.status === "ATIVO");
  const inactiveStudents = students.filter(s => s.status === "INATIVO");
  
  // Financeiro VIVO
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const paymentsThisMonth = payments.filter(p => {
    const d = new Date(p.dueDate + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const expensesThisMonth = expenses.filter(e => {
    const d = new Date(e.dueDate + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const expectedRevenueThisMonth = paymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);
  const collectedRevenueThisMonth = paymentsThisMonth.filter(p => p.status === "PAGO").reduce((acc, p) => acc + p.amount, 0);

  const collectedExpensesThisMonth = expensesThisMonth.filter(e => e.status === "PAGO").reduce((acc, e) => acc + e.amount, 0);
  const lucroLiquidoThisMonth = collectedRevenueThisMonth - collectedExpensesThisMonth;

  const delayedPayments = payments.filter(p => p.status === "ATRASADO");
  const defaultRateAmount = delayedPayments.reduce((acc, p) => acc + p.amount, 0);
  
  // Taxa global de Inadimplencia da Base Vigente (Atrasos / Faturamento Previsto Mes)
  const defaultRatePercentage = expectedRevenueThisMonth > 0 ? ((defaultRateAmount / expectedRevenueThisMonth) * 100).toFixed(1) : "0";

  // Check-ins Reais (Tatame Hoje)
  const todayStr = new Date().toISOString().split('T')[0];
  const checkinsToday = checkins.filter(c => c.timestamp.startsWith(todayStr));
  
  // Quem passou pela catraca hoje (unicos)
  const uniqueStudentsToday = Array.from(new Set(checkinsToday.map(c => c.studentId)))
     .map(id => students.find(s => s.id === id))
     .filter((s): s is Student => s !== undefined);

  // Fila de Graduação (Urgência)
  const aptosG = students.filter(s => 
    s.status === "ATIVO" && 
    (s.classesAttendedToNextRank >= s.classesTargetForNextRank || s.isReadyForExam)
  ).slice(0, 5);

  // Distribuição de faixas Viva
  const beltDistribution = Object.values(BeltRank).map(belt => ({
    name: belt,
    value: activeStudents.filter(s => s.beltRank === belt).length
  })).filter(b => b.value > 0);

  // Cálculos do Gráfico de Área (Crescimento de Caixa últimos 6 meses)
  const last6MonthsData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const isCurrent = i === 5;
    return {
      monthStr: d.toLocaleString('pt-BR', { month: 'short' }),
      monthNum: d.getMonth(),
      year: d.getFullYear(),
      receita: 0,
      despesa: 0,
      lucro: 0,
      isCurrent
    };
  });

  payments.forEach(p => {
    if (p.status === "PAGO" && p.dueDate) {
      const d = new Date(p.dueDate + 'T12:00:00');
      const slot = last6MonthsData.find(m => m.monthNum === d.getMonth() && m.year === d.getFullYear());
      if (slot) slot.receita += p.amount;
    }
  });

  expenses.forEach(e => {
    if (e.status === "PAGO" && e.dueDate) {
      const d = new Date(e.dueDate + 'T12:00:00');
      const slot = last6MonthsData.find(m => m.monthNum === d.getMonth() && m.year === d.getFullYear());
      if (slot) slot.despesa += e.amount;
    }
  });

  last6MonthsData.forEach(slot => {
    slot.lucro = slot.receita - slot.despesa;
  });

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Gradient Colors based on Academy Theme
  const isDark = academy.primaryColorHex === '#000000';
  const themeRgb = isDark ? "59, 130, 246" : "var(--primary)"; // Fallback to blue if black
  
  // Custom Tooltip Padrão UAU
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
          <p className="text-sm font-bold text-foreground capitalize mb-2 border-b border-border/50 pb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-1">
              <span className="flex items-center gap-2 text-sm text-foreground/80">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-sm tracking-tight">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
           <div className="w-3 h-10 rounded-full" style={{ backgroundColor: BELT_COLORS[data.name] || "#94a3b8" }} />
           <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Faixa {data.name}</p>
              <p className="text-lg font-black text-foreground">{data.value} Atletas</p>
           </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 max-w-[1600px] mx-auto pb-10">
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div>
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
            Dashboard Executivo
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Centro de Comando <span className="text-primary hidden sm:inline">•</span>
            <span className="text-xl font-medium text-muted-foreground hidden sm:inline">{academy.name}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl">
            Bem-vindo ao cockpit. Indicadores de faturamento, engajamento de alunos e matriz de cobrança calculados em tempo real a partir de hoje.
          </p>
        </div>
        <div className="bg-card/50 backdrop-blur-xs border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
           <div className="flex -space-x-3">
              {uniqueStudentsToday.slice(0, 3).map((s, i) => (
                 s.avatarUrl 
                 ? <img key={i} src={s.avatarUrl} className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                 : <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-primary/10 flex text-primary items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>
              ))}
              {uniqueStudentsToday.length > 3 && (
                 <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
                    +{uniqueStudentsToday.length - 3}
                 </div>
              )}
              {uniqueStudentsToday.length === 0 && (
                 <div className="w-10 h-10 rounded-full border-2 border-background bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <UserMinus className="w-4 h-4" />
                 </div>
              )}
           </div>
           <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quem Treinou Hoje</p>
              <p className="text-2xl font-black text-foreground">{uniqueStudentsToday.length} <span className="text-sm font-medium text-muted-foreground ml-1">atletas</span></p>
           </div>
        </div>
      </div>

      {/* KPI Cards (Vidro/Glow) */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI: Lucro Liquido do Mês */}
        <Card className="glass-card border-0 overflow-hidden relative group hover:-translate-y-1 transition-all duration-300 ring-1 ring-border/50 hover:ring-primary/50 hover:shadow-xl hover:shadow-primary/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-400 to-emerald-600" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-muted-foreground tracking-wide uppercase">Lucro Líquido</CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">{formatCurrency(lucroLiquidoThisMonth)}</div>
            <div className="flex items-center gap-2 mt-2">
               <Progress value={(lucroLiquidoThisMonth / (expectedRevenueThisMonth || 1)) * 100} className="h-1.5 flex-1 bg-muted" />
               <span className="text-[10px] font-bold text-muted-foreground w-12 text-right">{((lucroLiquidoThisMonth / (expectedRevenueThisMonth || 1)) * 100).toFixed(0)}% ref.</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide font-medium">De {formatCurrency(expectedRevenueThisMonth)} faturados no mês</p>
          </CardContent>
        </Card>

        {/* KPI: Alunos Ativos */}
        <Card className="glass-card border-0 overflow-hidden relative group hover:-translate-y-1 transition-all duration-300 ring-1 ring-border/50 hover:ring-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-400 to-blue-600" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-muted-foreground tracking-wide uppercase">Alunos Ativos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">{activeStudents.length}</div>
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1 font-medium bg-blue-500/5 px-2 py-1 rounded-md w-fit border border-blue-500/10">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-blue-600 dark:text-blue-400">Público Fidelizado</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI: Inadimplência Viva */}
        <Card className="glass-card border-0 overflow-hidden relative group hover:-translate-y-1 transition-all duration-300 ring-1 ring-border/50 hover:ring-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-400 to-amber-600" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-muted-foreground tracking-wide uppercase">Inadimplência</CardTitle>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-baseline gap-1">
               <div className="text-3xl font-black text-foreground tracking-tight">{defaultRatePercentage}%</div>
               <span className="text-sm font-bold text-muted-foreground">do total</span>
             </div>
            <p className="text-xs mt-2 text-amber-700 bg-amber-500/10 px-2 py-1 rounded-md inline-flex font-medium border border-amber-500/20 w-fit">
               {delayedPayments.length} mensalidades em atraso
            </p>
          </CardContent>
        </Card>

        {/* KPI: Alunos p/ Graduação */}
        <Card className="glass-card border-0 overflow-hidden relative group hover:-translate-y-1 transition-all duration-300 ring-1 ring-border/50 hover:ring-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-400 to-purple-600" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-muted-foreground tracking-wide uppercase">Candidatos à Faixa</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Award className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">{aptosG.length}</div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide font-medium">Bateram a Meta de Frequência</p>
          </CardContent>
        </Card>

      </div>

      {/* Row do Meio: Gráficos de Área e Donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        
        {/* Gráfico Linear de Área (Receita nos Semestres) */}
        <Card className="glass-card border-0 col-span-2 flex flex-col min-h-[400px]">
          <CardHeader className="pb-0 border-b border-border/20 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Evolução do Faturamento</CardTitle>
                <CardDescription className="font-medium mt-1">Crescimento financeiro contábil recebido</CardDescription>
              </div>
              <Badge variant="secondary" className="font-bold bg-muted text-foreground/80 rounded-lg px-3 py-1">6 Meses</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last6MonthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis 
                   dataKey="monthStr" 
                   tick={{ fontSize: 13, fill: 'var(--muted-foreground)', fontWeight: 600 }} 
                   axisLine={false} 
                   tickLine={false} 
                   dy={10}
                />
                <YAxis 
                   tick={{ fontSize: 13, fill: 'var(--muted-foreground)', fontWeight: 500 }} 
                   axisLine={false} 
                   tickLine={false} 
                   tickFormatter={(value) => `R$${value/1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorReceita)" 
                  name="Entradas" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#16a34a', className: "animate-pulse" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="despesa" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorDespesa)" 
                  name="Saídas" 
                  activeDot={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="lucro" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorLucro)" 
                  name="Lucro Real" 
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#2563eb' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Donut Dristribuição da Base */}
        <Card className="glass-card border-0 flex flex-col min-h-[400px]">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-black">Base de Atletas</CardTitle>
            <CardDescription className="font-medium mt-1">Hierarquia de {academy?.name || "sua academia"}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={beltDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    cornerRadius={6}
                  >
                    {beltDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BELT_COLORS[entry.name] || "#94a3b8"} className="hover:opacity-80 transition-opacity cursor-pointer stroke-background stroke-[2px]" />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} cursor={{ fill: 'transparent' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Central Donut Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black tracking-tighter text-foreground">{activeStudents.length}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Ativos</span>
              </div>
            </div>
            
            {/* Listagem das Maiores Faixas */}
            <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 gap-y-3 gap-x-2">
               {beltDistribution.sort((a,b) => b.value - a.value).slice(0, 4).map((belt) => (
                 <div key={belt.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border border-border shadow-sm shrink-0" style={{ backgroundColor: BELT_COLORS[belt.name] }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight uppercase text-foreground/80 wrap-break-word">{belt.name}</span>
                      <span className="text-[10px] font-medium text-muted-foreground leading-none">{belt.value} {belt.value === 1 ? 'aluno' : 'alunos'}</span>
                    </div>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roda-pé: Filas Operacionais */}
      <div className="grid gap-5 lg:grid-cols-2">
        
        {/* Tabela de Aprovação Graduação */}
        <Card className="glass-card border-0 flex flex-col">
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="flex items-center gap-2 text-xl font-black">
                     <Award className="h-5 w-5 text-indigo-500" />
                     Cerimônia e Faixa
                   </CardTitle>
                   <CardDescription className="font-medium mt-1">Convocação Baseada na Meta de Aulas</CardDescription>
                </div>
                {aptosG.length > 0 && <Badge className="bg-indigo-500 text-white rounded-lg">+{aptosG.length} Aptos</Badge>}
             </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
             <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 bg-muted/20 hover:bg-muted/20">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground w-1/2">Atleta</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Progresso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aptosG.length > 0 ? aptosG.map(s => (
                       <TableRow key={s.id} className="border-border/30 hover:bg-muted/30 transition-colors group">
                          <TableCell>
                             <div className="flex items-center gap-3">
                                {s.avatarUrl 
                                 ? <img src={s.avatarUrl} className="w-8 h-8 rounded-lg object-cover shadow-sm bg-muted group-hover:scale-105 transition-transform" />
                                 : <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 font-bold flex items-center justify-center text-xs group-hover:scale-105 transition-transform">{s.name.charAt(0)}</div>
                                }
                                <div className="flex flex-col">
                                   <span className="font-bold text-sm text-foreground/90 leading-tight">{s.name}</span>
                                   <div className="flex items-center gap-1.5 mt-0.5">
                                      <div className="h-1.5 w-4 rounded-full border border-border/50" style={{ backgroundColor: BELT_COLORS[s.beltRank.toUpperCase()] || '#cbd5e1' }} />
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Faixa {s.beltRank}</span>
                                   </div>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1.5 font-medium w-full max-w-[140px]">
                                <div className="flex justify-between items-baseline text-xs">
                                   <span className="text-emerald-500 font-bold">{s.classesAttendedToNextRank} Idas</span>
                                   <span className="text-muted-foreground text-[10px]">Meta: {s.classesTargetForNextRank}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                   <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min((s.classesAttendedToNextRank / s.classesTargetForNextRank) * 100, 100)}%` }} />
                                </div>
                             </div>
                          </TableCell>
                       </TableRow>
                    )) : (
                       <TableRow>
                          <TableCell colSpan={2} className="h-32">
                             <div className="flex flex-col items-center justify-center text-center">
                                <Award className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <span className="font-bold text-sm text-foreground/70">Turma sem Vencimentos de Faixa.</span>
                                <span className="text-xs text-muted-foreground mt-0.5">Incentive a frequência com novos planos de aula.</span>
                             </div>
                          </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
             </div>
          </CardContent>
        </Card>

        {/* Tabela de Atrasos / Cobranças (Whatsapp Action) */}
        <Card className="glass-card border-0 flex flex-col">
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="flex items-center gap-2 text-xl font-black">
                     <AlertCircle className="h-5 w-5 text-red-500" />
                     Painel de Cobrança
                   </CardTitle>
                   <CardDescription className="font-medium mt-1">Faturas Estouradas ({formatCurrency(defaultRateAmount)})</CardDescription>
                </div>
                {delayedPayments.length > 0 && <Badge variant="destructive" className="rounded-lg shadow-sm">Recuperar {delayedPayments.length}</Badge>}
             </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
             <div className="rounded-xl border border-red-500/20 bg-background/30 overflow-hidden flex-1 flex flex-col">
               {delayedPayments.length > 0 ? (
                  <div className="divide-y divide-red-500/10 flex-1 overflow-y-auto max-h-[240px]">
                     {delayedPayments.map(p => {
                        const s = students.find(x => x.id === p.studentId);
                        if (!s) return null;
                        
                        // Cria link para whatsapp
                        const phone = s.phone || s.guardianPhone || "";
                        const cleanPhone = phone.replace(/\D/g, "");
                        const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=Olá ${s.name}, notamos um atraso na sua mensalidade.` : '#';

                        return (
                           <div key={p.id} className="p-3.5 hover:bg-red-500/5 transition-colors flex items-center justify-between group">
                              <div className="flex flex-col">
                                 <span className="font-bold text-sm text-foreground leading-tight">{s.name}</span>
                                 <span className="text-[11px] font-semibold text-red-500/80 mt-0.5">Venceu dia {new Date(p.dueDate).toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span className="font-black text-sm text-foreground">{formatCurrency(p.amount)}</span>
                                 {cleanPhone ? (
                                   <a href={waLink} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105" title="Cobrar no WhatsApp">
                                      <Smartphone className="w-4 h-4" />
                                   </a>
                                 ) : (
                                   <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center" title="Sem telefone">
                                      <Smartphone className="w-4 h-4 opacity-50" />
                                   </div>
                                 )}
                              </div>
                           </div>
                        )
                     })}
                  </div>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-emerald-500/5 border border-emerald-500/20 m-2 rounded-xl">
                     <div className="h-12 w-12 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-4 ring-4 ring-emerald-500/20">
                        <Check className="h-6 w-6 text-white" />
                     </div>
                     <span className="font-black text-emerald-700 dark:text-emerald-400 text-lg">Acordo de Paz!</span>
                     <span className="text-sm font-medium text-emerald-600/70 dark:text-emerald-500/70 mt-1 max-w-[250px]">
                        Nenhuma mensalidade vencida na academia inteira. Turma 100% adimplente.
                     </span>
                  </div>
               )}
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}


