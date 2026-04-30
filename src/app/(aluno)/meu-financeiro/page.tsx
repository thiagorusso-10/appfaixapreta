"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useStudent } from "@/contexts/StudentContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Payment } from "@/lib/types";
import { Copy, Download, Share2 } from "lucide-react";
import { useState } from "react";

export default function FinanceiroAlunoPage() {
  const { academy } = useAcademy();
  const { selectedStudent: student } = useStudent();
  const { payments, isLoading } = useApi(academy?.id);

  const [selectedPixPayment, setSelectedPixPayment] = useState<Payment | null>(null);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!academy || isLoading) return null;
  if (!student) return <div className="p-4">Aluno não encontrado.</div>;
  
  const myPayments = payments.filter(p => p.studentId === student.id);

  // Ordenamos do mais recente pro mais antigo
  const sortedPayments = [...myPayments].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const handleCopyPix = () => {
     if (academy?.pixKey) {
        navigator.clipboard.writeText(academy.pixKey);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
     }
  };

  const handlePrintReceipt = () => {
     window.print();
  };

  const handleShareReceipt = () => {
     if (!selectedReceiptPayment) return;
     const text = `Recibo - ${academy?.name}\n\nAluno: ${student.name}\nValor Pago: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedReceiptPayment.amount)}\nData Pago: ${selectedReceiptPayment.paidDate ? new Date(selectedReceiptPayment.paidDate).toLocaleDateString('pt-BR') : '-'}\nReferência: ${selectedReceiptPayment.description}\n\nObrigado!`;
     window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      <div className="absolute top-4 md:top-8 right-4 md:right-8 z-10">
         <NotificationBell />
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meu Financeiro</h1>
          <p className="text-sm text-muted-foreground w-full">
            Acompanhe suas faturas e histórico de mensalidades da academia.
          </p>
        </div>
      </div>

      <div className="grid gap-4 mt-8">
        {sortedPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 rounded-xl border-border/50">
             <Receipt className="h-8 w-8 text-muted-foreground/30 mb-2" />
             <p className="text-muted-foreground text-sm">Nenhum histórico financeiro encontrado.</p>
          </div>
        ) : (
          sortedPayments.map((payment) => (
             <Card 
               key={payment.id} 
               className={`glass-card overflow-hidden transition-all duration-300 border-none shadow-sm ${
                 payment.status === 'ATRASADO' ? 'ring-1 ring-destructive/30 shadow-destructive/5' : 'shadow-primary/5'
               }`}
             >
               <div className={`h-1.5 w-full ${payment.status === 'ATRASADO' ? 'bg-destructive' : payment.status === 'PAGO' ? 'bg-emerald-500' : 'bg-primary/50'}`} />
               <CardContent className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                 
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <span className="font-bold text-xl">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                     </span>
                     {payment.status === 'ATRASADO' && (
                       <Badge variant="destructive" className="flex gap-1 items-center text-[10px] uppercase font-bold tracking-wider">
                         <AlertCircle className="h-3 w-3" /> Atrasada
                       </Badge>
                     )}
                     {payment.status === 'PAGO' && (
                       <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex gap-1 items-center text-[10px] uppercase font-bold tracking-wider">
                         <CheckCircle2 className="h-3 w-3" /> Pago
                       </Badge>
                     )}
                     {payment.status === 'PENDENTE' && (
                       <Badge variant="secondary" className="flex gap-1 items-center text-[10px] uppercase font-bold tracking-wider border-amber-500/20 bg-amber-500/10 text-amber-700">
                         Pendente
                       </Badge>
                     )}
                   </div>
                   <div className="text-sm text-muted-foreground space-y-0.5">
                     <p>Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                     <p className="text-xs opacity-70 italic">{payment.description}</p>
                   </div>
                 </div>

                 <div className="flex w-full sm:w-auto items-center">
                    {payment.status !== 'PAGO' ? (
                      <Button 
                        onClick={() => setSelectedPixPayment(payment)}
                        variant={payment.status === 'ATRASADO' ? 'destructive' : 'default'} 
                        className="w-full sm:w-auto shadow-lg shadow-primary/20 font-bold rounded-xl h-11 px-6 active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Pagar Agora
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setSelectedReceiptPayment(payment)}
                        variant="ghost" 
                        className="w-full sm:w-auto text-primary hover:bg-primary/10 rounded-xl font-semibold gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Recibo
                      </Button>
                    )}
                 </div>
               </CardContent>
             </Card>
          ))
        )}
      </div>

      {/* Modal PIX */}
      <Dialog open={!!selectedPixPayment} onOpenChange={(o) => !o && setSelectedPixPayment(null)}>
        <DialogContent className="sm:max-w-[425px] border-border/50 shadow-2xl rounded-2xl">
          <DialogHeader>
             <DialogTitle className="text-xl pb-2 border-b border-border/50">Pagamento PIX</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50">
               <span className="text-muted-foreground text-sm">Valor a pagar:</span>
               <span className="text-xl font-bold text-foreground">
                 {selectedPixPayment ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPixPayment.amount) : ''}
               </span>
             </div>
             
             <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Chave PIX da Academia</p>
                {academy?.pixKey ? (
                   <div className="flex gap-2">
                      <div className="flex-1 bg-secondary text-secondary-foreground p-3 rounded-xl border border-border/50 font-mono text-sm break-all flex items-center">
                         {academy.pixKey}
                      </div>
                      <Button onClick={handleCopyPix} size="icon" className="h-auto w-12 rounded-xl shrink-0">
                         {isCopied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </Button>
                   </div>
                ) : (
                   <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-sm text-center">
                      A academia ainda não configurou a chave PIX no sistema. Por favor, solicite-a diretamente na recepção.
                   </div>
                )}
             </div>

             <div className="text-center pt-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed px-4">
                  Após realizar a transferência, aguarde a confirmação. O processamento da baixa é feito de forma manual pelo seu professor.
                </p>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Recibo */}
      <Dialog open={!!selectedReceiptPayment} onOpenChange={(o) => !o && setSelectedReceiptPayment(null)}>
        <DialogContent className="sm:max-w-md border-border/50 shadow-2xl rounded-2xl print:shadow-none print:border-none print:w-full print:h-full print:max-w-none print:absolute print:inset-0 print:p-0">
           {selectedReceiptPayment && (
              <div className="bg-background print:p-8 flex flex-col h-full">
                 <div className="text-center space-y-2 mb-8 print:mb-12">
                     {academy?.logoUrl ? (
                        <img src={academy.logoUrl} alt={academy.name} className="h-16 mx-auto mb-2 print:h-20" />
                     ) : (
                        <div className="h-16 w-16 rounded-full bg-primary mx-auto mb-2 flex items-center justify-center print:border-2" />
                     )}
                     <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground">{academy?.name}</h2>
                     <p className="text-sm text-muted-foreground tracking-widest uppercase">Recibo de Pagamento</p>
                 </div>

                 <div className="space-y-4 flex-1">
                    <div className="flex justify-between border-b border-border/40 pb-2">
                       <span className="text-muted-foreground text-sm uppercase">Fatura / Ref</span>
                       <span className="font-semibold text-right">{selectedReceiptPayment.description}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-2">
                       <span className="text-muted-foreground text-sm uppercase">Aluno</span>
                       <span className="font-semibold text-right">{student.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-2">
                       <span className="text-muted-foreground text-sm uppercase">Data do Pgto</span>
                       <span className="font-semibold text-right">
                          {selectedReceiptPayment.paidDate ? new Date(selectedReceiptPayment.paidDate).toLocaleDateString('pt-BR') : '-'}
                       </span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-2">
                       <span className="text-muted-foreground text-sm uppercase">Valor</span>
                       <span className="font-bold text-lg text-emerald-600 block text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedReceiptPayment.amount)}
                       </span>
                    </div>

                    <div className="pt-12 text-center text-xs text-muted-foreground/60 print:block">
                        <p>Documento gerado eletronicamente por APP JUDO ECNA</p>
                        {academy?.documentNumber && <p>CNPJ/CPF: {academy.documentNumber}</p>}
                    </div>
                 </div>

                 <div className="flex gap-2 justify-end mt-8 print:hidden">
                    <Button variant="outline" onClick={handleShareReceipt} className="rounded-xl flex-1">
                       <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                    <Button onClick={handlePrintReceipt} className="rounded-xl flex-1 shadow-lg shadow-primary/20">
                       <Download className="h-4 w-4 mr-2" /> Salvar PDF
                    </Button>
                 </div>
              </div>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
