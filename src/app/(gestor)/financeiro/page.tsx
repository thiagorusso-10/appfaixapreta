"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CreditCard, Plus, CheckCircle2, MessageCircle, Bot, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileDown } from "lucide-react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
const YEARS = [2025, 2026, 2027];

export default function FinanceiroPage() {
  const { academy } = useAcademy();
  const [refresh, setRefresh] = useState(0);

  // States de Filtro de Competência
  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState(currentYearVal);
  const [selectedTurma, setSelectedTurma] = useState("all");

  const [activeTab, setActiveTab] = useState("TODOS");

  // Hook Supabase (API Real)
  const { 
    students, 
    payments, 
    turmas,
    isLoading,
    createPayment,
    updatePaymentStatus,
    deletePayment,
    generateMonthlyInvoices
  } = useApi(academy?.id);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    amount: 150,
    dueDate: new Date().toISOString().split("T")[0],
    method: "PIX",
    description: "Mensalidade"
  });

  useEffect(() => {
    if (students.length > 0 && !formData.studentId) {
      setFormData(prev => ({ ...prev, studentId: students[0].id }));
    }
  }, [students, formData.studentId]);

  if (!academy || isLoading) return null;

  // Filtragem Mestre (Competência Selecionada + Turma)
  const competencyPayments = payments.filter(p => {
    // 1. Filtrar por Turma
    const student = students.find(s => s.id === p.studentId);
    if (selectedTurma !== "all" && student?.turmaId !== selectedTurma) return false;

    // 2. Filtrar por Competência (Data)
    // O mock já guarda T12:00:00 agora. Só usamos string splice para evitar bug do fuso local 00:00:
    const isoDateStr = p.dueDate.split("T")[0]; // YYYY-MM-DD
    const [y, m, d] = isoDateStr.split("-");
    const docMonth = parseInt(m, 10) - 1; 
    const docYear = parseInt(y, 10);
    return docMonth === selectedMonth && docYear === selectedYear;
  });

  // KPIs dinâmicos da competência filtrada
  const totalReceita = competencyPayments.filter(p => p.status === "PAGO").reduce((s, p) => s + p.amount, 0);
  const totalPendente = competencyPayments.filter(p => p.status === "PENDENTE").reduce((s, p) => s + p.amount, 0);
  const totalAtrasado = competencyPayments.filter(p => p.status === "ATRASADO").reduce((s, p) => s + p.amount, 0);
  const totalGeral = totalReceita + totalPendente + totalAtrasado;
  const taxaInadimplencia = totalGeral > 0 ? ((totalAtrasado / totalGeral) * 100).toFixed(1) : "0";

  // Chart Data
  // Chart Data
  const statusData = [
    { name: "Pago", value: competencyPayments.filter(p => p.status === "PAGO").length, color: "#22C55E" },
    { name: "Pendente", value: competencyPayments.filter(p => p.status === "PENDENTE").length, color: "#F59E0B" },
    { name: "Atrasado", value: competencyPayments.filter(p => p.status === "ATRASADO").length, color: "#EF4444" },
  ].filter(d => d.value > 0);

  // Chart Data: Evolução Histórica dinâmica (pegando os últimos 6 meses até a competência selecionada)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const diff = 5 - i;
    let m = selectedMonth - diff;
    let y = selectedYear;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    
    const monthPayments = payments.filter(p => {
        if (selectedTurma !== "all") {
             const student = students.find(s => s.id === p.studentId);
             if (student?.turmaId !== selectedTurma) return false;
        }
        const isoParts = p.dueDate.split("T")[0].split("-");
        const docMonth = parseInt(isoParts[1], 10) - 1; 
        const docYear = parseInt(isoParts[0], 10);
        return docMonth === m && docYear === y;
    });
    
    const receita = monthPayments.filter(p => p.status === "PAGO").reduce((acc, p) => acc + p.amount, 0);
    const despesa = monthPayments.filter(p => p.status === "ATRASADO").reduce((acc, p) => acc + p.amount, 0);
    
    return {
       // Se o mês gerado for de ano anterior ao selecionado, mostra /YY
       mes: MONTHS[m].substring(0, 3) + (y !== selectedYear ? `/${y.toString().slice(-2)}` : ''), 
       receita, 
       despesa 
    };
  });

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // Tabela Filtrada com abas
  const filteredPaymentsTable = competencyPayments.filter(p => {
    if (activeTab === "TODOS") return true;
    return p.status === activeTab;
  });

  const handleSavePayment = async () => {
    if (!formData.studentId) {
      alert("Selecione um aluno.");
      return;
    }
    const dateInput = new Date(formData.dueDate + "T12:00:00Z");

    let status = "PENDENTE";
    if (dateInput.getTime() < new Date().getTime() - 86400000) {
      status = "ATRASADO";
    }
    
    await createPayment({
      studentId: formData.studentId,
      amount: Number(formData.amount),
      dueDate: formData.dueDate,
      status: status as any,
      method: formData.method as any,
      description: formData.description
    });
    
    setIsDialogOpen(false);
    setRefresh(r => r + 1); // Força render
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    if (confirm("Confirmar baixa no pagamento? Ele será Movido para as Receitas Recebidas.")) {
      await updatePaymentStatus(paymentId, 'PAGO', new Date().toISOString());
      setRefresh(r => r + 1);
    }
  };

  const handleDeletePayment = async (paymentId: string, studentName: string) => {
    if (confirm(`Excluir permanentemente o lançamento de ${studentName}? Esta ação não pode ser desfeita.`)) {
      await deletePayment(paymentId);
      setRefresh(r => r + 1);
    }
  };

  const handleGenerateBatch = async () => {
    const isPast = selectedYear < currentYearVal || (selectedYear === currentYearVal && selectedMonth < currentMonthIdx);
    
    let msg = `Você está prestes a AUTOGERAR mensalidades de ${MONTHS[selectedMonth]}/${selectedYear} para todos os Alunos Ativos Não-Isentos.\n\nEles receberão uma fatura 'Pendente' vencendo dia 10.\nSe alguém já tiver fatura no mês, será ignorado.\nDeseja prosseguir?`;
    
    if (isPast) {
       msg = `⚠️ ATENÇÃO: Você está gerando faturas retroativas para o mês de ${MONTHS[selectedMonth]}/${selectedYear}. Elas nascerão com o status ATRASADO e impactarão negativamente sua inadimplência nesta tela.\nTem certeza absoluta?`;
    }

    if (confirm(msg)) {
       const qty = await generateMonthlyInvoices(selectedMonth, selectedYear, 150);
       alert(`${qty} boletos lançados com sucesso! Se for 0, é porque não haviam alunos sem fatura no período.`);
       setRefresh(r => r + 1);
    }
  };

  const getWhatsAppLink = (studentId: string, amount: number, dueDate: string) => {
    const student = students.find(s => s.id === studentId);
    const phoneClear = student?.phone ? student.phone.replace(/\D/g, '') : "00000000000"; 
    const isLate = new Date(dueDate).getTime() < new Date().getTime();
    const nomeBreve = student?.name ? student.name.split(" ")[0] : "Atleta";
    
    const text = isLate 
      ? `Olá ${nomeBreve}! Aqui é da academia ${academy.name}. Identificamos que a sua mensalidade de ${formatCurrency(amount)} encontra-se pendente. Gostaria de regularizar hoje para evitar juros no próximo mês e manter tudo em dia pro check-in? Obrigado! 🥋`
      : `Olá ${nomeBreve}! Aqui é da academia ${academy.name}. Passando pra lembrar sobre o vencimento de sua taxa mensal de ${formatCurrency(amount)} em breve para o período de ${MONTHS[selectedMonth]}. Tudo certo por aqui? 🥋`;
      
    return `https://wa.me/55${phoneClear}?text=${encodeURIComponent(text)}`;
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
    doc.text(`Relatório Financeiro — ${MONTHS[selectedMonth]} / ${selectedYear}`, 14, 33);
    
    // Linha separadora
    doc.setDrawColor(200);
    doc.line(14, 36, 196, 36);
    
    // KPIs resumo
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'bold');
    doc.text(`Receita Prevista: ${formatCurrency(totalGeral)}`, 14, 43);
    doc.text(`Recebido: ${formatCurrency(totalReceita)}`, 80, 43);
    doc.text(`Inadimplência: ${formatCurrency(totalAtrasado)}`, 145, 43);

    // Tabela
    const tableRows = filteredPaymentsTable.map(p => {
      const s = students.find((st: any) => st.id === p.studentId);
      return [
        s?.name || 'N/A',
        formatCurrency(p.amount),
        new Date(p.dueDate + 'T12:00:00').toLocaleDateString('pt-BR'),
        p.method,
        p.status === 'PAGO' ? '✅ Pago' : p.status === 'ATRASADO' ? '🔴 Atrasado' : '🟡 Pendente'
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Aluno', 'Valor', 'Vencimento', 'Método', 'Status']],
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

    doc.save(`financeiro_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        
        {/* Lado Esquerdo - Header e Filtros */}
        <div className="space-y-3 pt-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Gestão Financeira
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl">
              Navegue pelos meses letivos, controle recebimentos via PIX ou Cartão, dê baixas manuais na inadimplência e automatize faturas em lote por competência.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-2">
             <div className="flex bg-muted/30 border border-border/50 rounded-xl overflow-hidden p-1 shadow-sm">
                <select 
                  className="bg-transparent font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <div className="w-px bg-border/50 my-1 mx-1" />
                <select 
                  className="bg-transparent font-medium px-3 py-1.5 focus:outline-none text-muted-foreground cursor-pointer"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>

             <div className="flex bg-muted/30 border border-border/50 rounded-xl overflow-hidden p-1 shadow-sm">
                <select 
                  className="bg-transparent font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
                  value={selectedTurma}
                  onChange={e => setSelectedTurma(e.target.value)}
                >
                  <option value="all">Todas as Academias / Turmas</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
             </div>
             
             <Button variant="secondary" onClick={handleGenerateBatch} className="rounded-xl ml-2 shadow-sm font-semibold text-primary hover:text-primary-foreground hover:bg-primary border border-primary/20">
               <Bot className="h-4 w-4 mr-2" />
               Gerar Faturas ({MONTHS[selectedMonth]})
             </Button>
             
             <Button variant="outline" onClick={handleExportPDF} className="rounded-xl shadow-sm font-semibold border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors">
               <FileDown className="h-4 w-4 mr-2" />
               Exportar PDF
             </Button>
          </div>
        </div>

        {/* Lado Direito - Action Cima */}
        <div className="pt-2">
           <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 h-11 px-5 rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold">
             <Plus className="mr-2 h-5 w-5" /> Lançar Taxa Avulsa
           </Button>
        </div>
      </div>

      {/* Modal Lançar Cobrança */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lançamento Manual (Taxas Extras)</DialogTitle>
            <DialogDescription>Crie uma cobrança que caiu fora da virada de mês (Kimonos, Provas, etc).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="student">Atleta Cobrado</Label>
              <select
                id="student"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formData.studentId}
                onChange={e => setFormData({ ...formData, studentId: e.target.value })}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — Faixa {s.beltRank}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
               <Label htmlFor="desc">Motivo / Descrição</Label>
               <Input id="desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="val">Valor Parcela (R$)</Label>
                <Input id="val" type="number" step="10" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metodo">Meio de Pgto</Label>
                <select id="metodo" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })}>
                  <option value="PIX">PIX</option>
                  <option value="CARTAO">Cartão de Crédito</option>
                  <option value="DINHEIRO">Dinheiro Vivo</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due">Data de Vencimento</Label>
              <Input id="due" type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
          </div>
          <Button className="w-full rounded-xl" onClick={handleSavePayment}>Salvar Lançamento</Button>
        </DialogContent>
      </Dialog>

      {/* KPI Cards (Respects Competency Isolation) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
        <Card className="glass-card kpi-glow-green border-0 overflow-hidden relative group hover:-translate-y-1 transition-all">
           <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-400 to-emerald-600" />
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
             <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Receita Líquida</CardTitle>
             <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
               <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
             </div>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-foreground">{formatCurrency(totalReceita)}</div>
           </CardContent>
        </Card>
        <Card className="glass-card kpi-glow-amber border-0 overflow-hidden relative group hover:-translate-y-1 transition-all">
           <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-400 to-amber-600" />
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
             <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Faturas a Receber</CardTitle>
             <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
               <CreditCard className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
             </div>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-foreground">{formatCurrency(totalPendente)}</div>
           </CardContent>
        </Card>
        <Card className="glass-card kpi-glow-red border-0 overflow-hidden relative group hover:-translate-y-1 transition-all">
           <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-400 to-red-600" />
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
             <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Inadimplência Real</CardTitle>
             <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center">
               <TrendingDown className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
             </div>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-foreground">{formatCurrency(totalAtrasado)}</div>
           </CardContent>
        </Card>
        <Card className="glass-card kpi-glow-blue border-0 overflow-hidden relative group hover:-translate-y-1 transition-all">
           <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-400 to-blue-600" />
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
             <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Risco Inadimpl.</CardTitle>
             <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
               <AlertTriangle className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
             </div>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-foreground">{taxaInadimplencia}%</div>
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Gráfico de Barras - Faturamento */}
         <Card className="glass-card border-0 lg:col-span-2">
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <DollarSign className="h-4 w-4 text-primary" />
               Evolução Histórica vs Competência Selecionada
             </CardTitle>
             <CardDescription>O último mês reflete as projeções da sua Tabela isolada atual.</CardDescription>
           </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={280}>
               <BarChart data={monthlyData} barGap={4}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                 <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                 <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
                 <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} formatter={(value: any) => [formatCurrency(Number(value))]} />
                 <Bar dataKey="receita" name="Receita" fill="#22C55E" radius={[6, 6, 0, 0]} />
                 <Bar dataKey="despesa" name="Atrasos" fill="#EF4444" radius={[6, 6, 0, 0]} opacity={0.7} />
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
 
         {/* Gráfico de Pizza - Status */}
         <Card className="glass-card border-0">
           <CardHeader>
             <CardTitle className="text-base">Saúde Geral da Competência</CardTitle>
             <CardDescription>Mix de {MONTHS[selectedMonth]}/{selectedYear}</CardDescription>
           </CardHeader>
           <CardContent>
             {statusData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                   <div className="h-12 w-12 rounded-full bg-muted/40 mb-3 flex items-center justify-center">
                     <AlertTriangle className="h-5 w-5 text-muted-foreground/30" />
                   </div>
                   <p className="text-sm font-medium text-foreground">Aba vazia</p>
                   <p className="text-xs text-muted-foreground mt-1 px-4">Utilize o botão 'Gerar Faturas' acima para criar a massa desta competência.</p>
                </div>
             ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center flex-wrap gap-4 mt-2">
                    {statusData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs font-medium">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </>
             )}
           </CardContent>
         </Card>
      </div>

      {/* Tabela de Gestão de Cobranças */}
      <Card className="glass-card border-0 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 bg-card/40">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <CardTitle className="text-lg">Cobranças deste Mês</CardTitle>
               <CardDescription>Mostrando lançamentos de {MONTHS[selectedMonth]} {selectedYear}.</CardDescription>
            </div>
            
            <Tabs defaultValue="TODOS" value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-4 shadow-sm border border-border/50">
                <TabsTrigger value="TODOS">Todos</TabsTrigger>
                <TabsTrigger value="PAGO">Pagos</TabsTrigger>
                <TabsTrigger value="PENDENTE">Pend.</TabsTrigger>
                <TabsTrigger value="ATRASADO">Atrasos</TabsTrigger>
              </TabsList>
            </Tabs>
           </div>
        </CardHeader>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium w-[25%] uppercase text-xs tracking-wider">Atleta / Resp.</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium uppercase text-xs tracking-wider">Detalhes / Venc.</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium uppercase text-xs tracking-wider">Valor Bruto</th>
                <th className="text-left py-4 px-6 text-muted-foreground font-medium uppercase text-xs tracking-wider">Situação</th>
                <th className="text-right py-4 px-6 text-muted-foreground font-medium uppercase text-xs tracking-wider">Opções Financeiras</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaymentsTable.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="py-20 text-center text-muted-foreground bg-card/10">
                       <div className="flex flex-col items-center justify-center opacity-60">
                         <div className="h-16 w-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                         </div>
                         <p className="text-base font-medium">Caixa Limpo</p>
                         <p className="text-sm mt-1 max-w-sm mx-auto">Não há boletos listados para os filtros selecionados. Crie taxas extras manualmente ou gere em lote.</p>
                       </div>
                    </td>
                 </tr>
              ) : filteredPaymentsTable.map(pay => {
                const student = students.find(s => s.id === pay.studentId);
                const statusColor = pay.status === "PAGO" ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" 
                  : pay.status === "ATRASADO" ? "text-red-500 bg-red-500/10 border border-red-500/20" 
                  : "text-amber-500 bg-amber-500/10 border border-amber-500/20";
                
                const isPaid = pay.status === "PAGO";
                const isLate = pay.status === "ATRASADO";

                return (
                  <tr key={pay.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${isPaid ? 'opacity-80' : ''}`}>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-foreground">{student?.name || "Desconhecido"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ID: {student?.id?.substring(0,6) || "..."}</p>
                    </td>
                    <td className="py-4 px-6">
                       <p className="text-[11px] font-semibold text-primary uppercase mb-0.5">{pay.description || 'Mensalidade'}</p>
                       <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                         Vence em {new Date(pay.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                       </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-foreground text-base">{formatCurrency(pay.amount)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{pay.method}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest ${statusColor}`}>
                        <div className={`h-1.5 w-1.5 rounded-full mr-2 ${isPaid ? 'bg-emerald-500' : isLate ? 'bg-red-500' : 'bg-amber-500'} animate-pulse`} />
                        {pay.status}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className={`h-9 font-bold rounded-xl px-4 ${isPaid ? 'opacity-30 cursor-not-allowed border-emerald-500/20 text-emerald-500 bg-transparent' : 'hover:bg-emerald-500 hover:text-white border-emerald-500 text-emerald-600 bg-emerald-500/5'}`}
                         disabled={isPaid}
                         onClick={() => handleMarkAsPaid(pay.id)}
                       >
                         {isPaid ? <CheckCircle2 className="w-4 h-4 mr-2 opacity-50"/> : <CheckCircle2 className="w-4 h-4 mr-2" />} 
                         {isPaid ? 'Conciliado' : 'Dar Baixa PIX'}
                       </Button>

                       {(!isPaid) && (
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className={`h-9 w-9 p-0 rounded-xl border-amber-500 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm ${!isLate && 'border-border text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground shadow-none'}`}
                           onClick={() => {
                              if (!student?.phone) alert("Info MOCK: Este aluno não possui celular. Abrindo WhatsApp default...");
                              window.open(getWhatsAppLink(pay.studentId, pay.amount, pay.dueDate), '_blank');
                           }}
                           title={isLate ? "Cobrar Atraso WhatsApp" : "Aviso Amigável WhatsApp"}
                         >
                           <MessageCircle className="w-[18px] h-[18px]" />
                         </Button>
                       )}

                       {/* Botão Excluir */}
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                         onClick={() => handleDeletePayment(pay.id, student?.name || 'Desconhecido')}
                         title="Excluir lançamento"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
