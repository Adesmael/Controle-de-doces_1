
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Banknote, PlusCircle, Edit3, Trash2, Save, XCircle, Loader2, CalendarIcon as CalendarLucideIcon, DollarSign, Filter, FileText, TrendingUp, TrendingDown, Activity, FileOutput } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FinancialTransaction, FinancialTransactionFormValues } from "@/lib/types";
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES, TRANSACTION_PAYMENT_METHODS, TRANSACTION_STATUSES } from "@/lib/finance-constants";
import { getFinancialTransactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction } from "@/lib/storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"; // Basic chart components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';


const financialTransactionFormSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  type: z.enum(TRANSACTION_TYPES, { required_error: "O tipo é obrigatório." }),
  originDestination: z.string().min(2, "Origem/Destino deve ter pelo menos 2 caracteres.").max(100, "Máximo 100 caracteres."),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres.").max(200, "Máximo 200 caracteres."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  category: z.enum(TRANSACTION_CATEGORIES, { required_error: "A categoria é obrigatória." }),
  paymentMethod: z.enum(TRANSACTION_PAYMENT_METHODS, { required_error: "A forma de pagamento é obrigatória." }),
  status: z.enum(TRANSACTION_STATUSES, { required_error: "O status é obrigatório." }),
  notes: z.string().max(300, "Máximo 300 caracteres.").optional(),
});

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const storedTransactions = await getFinancialTransactions();
      setTransactions(storedTransactions.map(t => ({ ...t, date: new Date(t.date) })));
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({ title: "Erro ao carregar transações", description: "Não foi possível buscar os dados financeiros.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<FinancialTransactionFormValues>({
    resolver: zodResolver(financialTransactionFormSchema),
    defaultValues: {
      date: new Date(),
      type: "Entrada",
      originDestination: "",
      description: "",
      value: 0,
      category: "Venda",
      paymentMethod: "Pix",
      status: "Pago",
      notes: "",
    },
  });

  const resetFormAndState = () => {
    form.reset({
      date: new Date(),
      type: "Entrada",
      originDestination: "",
      description: "",
      value: 0,
      category: "Venda",
      paymentMethod: "Pix",
      status: "Pago",
      notes: "",
    });
    setEditingTransaction(null);
  };

  async function onSubmit(data: FinancialTransactionFormValues) {
    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        const updatedTransaction: FinancialTransaction = { ...editingTransaction, ...data };
        await updateFinancialTransaction(updatedTransaction);
        toast({ title: "Transação Atualizada!", description: "A movimentação financeira foi atualizada." });
      } else {
        const newTransaction: FinancialTransaction = { id: String(Date.now() + Math.random()), ...data }; // Added Math.random for more unique ID
        await addFinancialTransaction(newTransaction);
        toast({ title: "Transação Adicionada!", description: "Nova movimentação financeira registrada." });
      }
      await fetchTransactions();
      resetFormAndState();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a transação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    form.reset({ ...transaction, date: new Date(transaction.date) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (transaction: FinancialTransaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete) {
      setIsSubmitting(true);
      try {
        await deleteFinancialTransaction(transactionToDelete.id);
        toast({ title: "Transação Excluída!", description: "A movimentação financeira foi removida.", variant: "destructive" });
        await fetchTransactions();
        if (editingTransaction && editingTransaction.id === transactionToDelete?.id) {
          resetFormAndState();
        }
      } catch (error) {
        console.error("Failed to delete transaction:", error);
        toast({ title: "Erro ao Excluir", description: "Não foi possível excluir a transação.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setShowDeleteConfirm(false);
        setTransactionToDelete(null);
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0,0,0,0); // Normalize transaction date for comparison

      const start = filterStartDate ? new Date(filterStartDate) : null;
      if(start) start.setHours(0,0,0,0);
      const end = filterEndDate ? new Date(filterEndDate) : null;
      if(end) end.setHours(0,0,0,0);
      
      if (start && transactionDate < start) return false;
      if (end && transactionDate > end) return false;
      if (filterType && t.type !== filterType) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [transactions, filterStartDate, filterEndDate, filterType, filterCategory, filterStatus]);

  const summary = useMemo(() => {
    const totalEntradas = filteredTransactions
      .filter(t => t.type === "Entrada")
      .reduce((sum, t) => sum + t.value, 0);
    const totalSaidas = filteredTransactions
      .filter(t => t.type === "Saída" || t.type === "Despesa fixa" || t.type === "Despesa variável")
      .reduce((sum, t) => sum + t.value, 0);
    const lucroLiquido = totalEntradas - totalSaidas;
    return { totalEntradas, totalSaidas, lucroLiquido };
  }, [filteredTransactions]);
  
  const handleExport = () => {
    try {
        const jsonString = JSON.stringify(filteredTransactions, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `movimentacoes_financeiras_${format(new Date(), "yyyy-MM-dd")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: "Dados Exportados!",
            description: "As transações filtradas foram exportadas como JSON.",
        });
    } catch (error) {
        console.error("Erro ao exportar dados:", error);
        toast({
            title: "Erro na Exportação",
            description: "Não foi possível exportar os dados.",
            variant: "destructive",
        });
    }
  };

  const chartData = useMemo(() => {
    const dataByMonth: { [key: string]: { month: string; Entrada: number; Saida: number } } = {};
    filteredTransactions.forEach(t => {
        const monthYear = format(new Date(t.date), "MMM/yy", { locale: ptBR });
        if (!dataByMonth[monthYear]) {
            dataByMonth[monthYear] = { month: monthYear, Entrada: 0, Saida: 0 };
        }
        if (t.type === "Entrada") {
            dataByMonth[monthYear].Entrada += t.value;
        } else if (t.type === "Saída" || t.type === "Despesa fixa" || t.type === "Despesa variável") {
            dataByMonth[monthYear].Saida += t.value;
        }
    });
    return Object.values(dataByMonth).sort((a,b) => parseISO(format(new Date(a.month), "yyyy-MM-dd", {locale: ptBR})).getTime() - parseISO(format(new Date(b.month), "yyyy-MM-dd", {locale: ptBR})).getTime());
  }, [filteredTransactions]);


  const getStatusClass = (status: FinancialTransaction["status"]) => {
    switch (status) {
      case "Pago": return "text-green-600";
      case "A receber": return "text-blue-600";
      case "Em aberto": return "text-orange-500";
      case "Vencido": return "text-red-700 font-semibold";
      case "Agendado": return "text-purple-600";
      case "Cancelado": return "text-gray-500 line-through";
      default: return "text-muted-foreground";
    }
  };
  const getValueClass = (type: FinancialTransaction["type"]) => {
    if (type === "Entrada") return "text-green-600 font-semibold";
    return "text-red-600 font-semibold";
  }


  if (isLoading && transactions.length === 0) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando dados financeiros...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <Banknote size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              {editingTransaction ? "Editar Movimentação Financeira" : "Gestão Financeira"}
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            {editingTransaction ? `Modifique os dados da movimentação.` : "Registre e gerencie suas movimentações financeiras."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-primary-foreground/90 flex items-center"><CalendarLucideIcon size={16} className="mr-2"/>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                              <CalendarLucideIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90">Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                        <SelectContent>{TRANSACTION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="originDestination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90">Origem/Destino</FormLabel>
                    <FormControl><Input placeholder="Ex: Cliente X, Fornecedor Y, Aluguel Escritório" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90">Descrição</FormLabel>
                    <FormControl><Textarea placeholder="Detalhes da movimentação" {...field} className="min-h-[80px]" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90 flex items-center"><DollarSign size={16} className="mr-2"/>Valor (R$)</FormLabel>
                      <FormControl><Input type="number" placeholder="150.00" {...field} step="0.01" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90">Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl>
                        <SelectContent>{TRANSACTION_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90">Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione a forma de pagamento" /></SelectTrigger></FormControl>
                        <SelectContent>{TRANSACTION_PAYMENT_METHODS.map(pm => <SelectItem key={pm} value={pm}>{pm}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                        <SelectContent>{TRANSACTION_STATUSES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90">Observações (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Informações adicionais" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-animated" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingTransaction ? <><Save size={18} className="mr-2" /> Salvar</> : <><PlusCircle size={18} className="mr-2" /> Adicionar Movimentação</>)}
                </Button>
                {editingTransaction && (
                  <Button type="button" variant="outline" onClick={resetFormAndState} className="btn-animated" disabled={isSubmitting}>
                    <XCircle size={18} className="mr-2" /> Cancelar Edição
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md bg-green-500/10 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total de Entradas</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-700">R$ {summary.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card className="shadow-md bg-red-500/10 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total de Saídas</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-700">R$ {summary.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card className={`shadow-md ${summary.lucroLiquido >= 0 ? 'bg-blue-500/10 border-blue-500' : 'bg-orange-500/10 border-orange-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${summary.lucroLiquido >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Lucro Líquido</CardTitle>
            <DollarSign className={`h-5 w-5 ${summary.lucroLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent><div className={`text-2xl font-bold ${summary.lucroLiquido >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>R$ {summary.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center"><Filter size={20} className="mr-2 text-primary" /> Filtros de Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <FormItem>
            <FormLabel>Data Inicial</FormLabel>
             <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filterStartDate && "text-muted-foreground")}>
                    <CalendarLucideIcon className="mr-2 h-4 w-4" />
                    {filterStartDate ? format(filterStartDate, "PPP", { locale: ptBR }) : <span>Selecione a data inicial</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterStartDate} onSelect={setFilterStartDate} initialFocus locale={ptBR} /></PopoverContent>
              </Popover>
          </FormItem>
          <FormItem>
            <FormLabel>Data Final</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filterEndDate && "text-muted-foreground")}>
                  <CalendarLucideIcon className="mr-2 h-4 w-4" />
                  {filterEndDate ? format(filterEndDate, "PPP", { locale: ptBR }) : <span>Selecione a data final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterEndDate} onSelect={setFilterEndDate} initialFocus locale={ptBR} /></PopoverContent>
            </Popover>
          </FormItem>
          <FormItem>
            <FormLabel>Tipo</FormLabel>
            <Select onValueChange={setFilterType} value={filterType}>
              <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
              <SelectContent><SelectItem value="">Todos os tipos</SelectItem>{TRANSACTION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
          </FormItem>
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select onValueChange={setFilterCategory} value={filterCategory}>
              <SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
              <SelectContent><SelectItem value="">Todas as categorias</SelectItem>{TRANSACTION_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
          </FormItem>
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={setFilterStatus} value={filterStatus}>
              <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
              <SelectContent><SelectItem value="">Todos os status</SelectItem>{TRANSACTION_STATUSES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </FormItem>
          <Button onClick={handleExport} variant="outline" className="self-end"><FileOutput size={18} className="mr-2"/>Exportar Filtrados</Button>
        </CardContent>
      </Card>
      
      {/* Transactions Table */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary-foreground">Movimentações Registradas ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && filteredTransactions.length === 0 && !transactions.length ? (
            <div className="text-center py-10 text-muted-foreground">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                Carregando movimentações...
            </div>
          ) : !isLoading && filteredTransactions.length === 0 && transactions.length > 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3"/>
                <p className="text-lg">Nenhuma movimentação encontrada para os filtros aplicados.</p>
                <p className="text-sm">Ajuste os filtros ou adicione novas movimentações.</p>
            </div>
          ): !isLoading && transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3"/>
                <p className="text-lg">Nenhuma movimentação financeira cadastrada.</p>
                <p className="text-sm">Use o formulário acima para adicionar a primeira movimentação.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem/Destino</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor (R$)</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Forma Pag.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.originDestination}</TableCell>
                    <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                    <TableCell className={`text-right ${getValueClass(transaction.type)}`}>{transaction.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell><span className={getStatusClass(transaction.status)}>{transaction.status}</span></TableCell>
                    <TableCell className="text-center space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleEditTransaction(transaction)} className="btn-animated" disabled={isSubmitting}><Edit3 size={14}/></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(transaction)} className="btn-animated" disabled={isSubmitting}><Trash2 size={14}/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Lista de movimentações financeiras registradas.</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card className="shadow-xl">
          <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center"><Activity size={20} className="mr-2 text-primary"/>Gráfico de Movimentações Mensais</CardTitle>
              <CardDescription>Entradas vs Saídas por mês (baseado nos filtros aplicados).</CardDescription>
          </CardHeader>
          <CardContent>
              {chartData.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                      <FileText size={40} className="mx-auto mb-3"/>
                      <p className="text-lg">Sem dados suficientes para exibir o gráfico.</p>
                      <p className="text-sm">Verifique os filtros ou adicione mais transações.</p>
                  </div>
              ) : (
                  <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`} />
                          <RechartsTooltip formatter={(value: number) => `R$${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                          <Legend />
                          <Bar dataKey="Entrada" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Saida" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              )}
          </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><Trash2 className="text-destructive mr-2"/>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação financeira: "{transactionToDelete?.description}" no valor de R$ {transactionToDelete?.value.toFixed(2)}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {if(!isSubmitting) setTransactionToDelete(null)}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Excluir Movimentação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
