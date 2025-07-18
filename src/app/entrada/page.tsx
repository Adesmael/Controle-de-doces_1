
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, PlusCircle, DollarSign, Package, CalendarIcon as CalendarLucideIcon, Hash, Warehouse, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Entry, EntryFormValues, Supplier } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getProducts, getEntries, addEntry, getProductById, updateProduct, deleteEntry, getSuppliers } from "@/lib/storage";
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

const entryFormSchema = z.object({
  date: z.date({
    required_error: "A data da entrada é obrigatória.",
  }),
  supplierId: z.string().min(1, {
    message: "Selecione um fornecedor.",
  }),
  productId: z.string().min(1, {
    message: "Selecione um produto.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "A quantidade deve ser um número inteiro positivo.",
  }),
  unitPrice: z.coerce.number().positive({ 
    message: "O custo unitário deve ser um número positivo.",
  }).transform(val => parseFloat(val.toFixed(2))),
});

export default function EntradaPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [calculatedTotalCost, setCalculatedTotalCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [storedProducts, storedEntries, storedSuppliers] = await Promise.all([
        getProducts(),
        getEntries(),
        getSuppliers()
      ]);
      setProducts(storedProducts.sort((a,b) => a.name.localeCompare(b.name)));
      setEntries(storedEntries.map(e => ({...e, date: new Date(e.date)})));
      setSuppliersList(storedSuppliers.sort((a,b) => a.supplierName.localeCompare(b.supplierName)));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Erro ao Carregar Dados", description: "Não foi possível buscar produtos, entradas ou fornecedores.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      date: new Date(),
      supplierId: "",
      productId: "",
      quantity: 1,
      unitPrice: 0,
    },
  });

  const watchedQuantity = form.watch("quantity");
  const watchedUnitPrice = form.watch("unitPrice");

  useEffect(() => {
    const quantity = watchedQuantity || 0;
    const unitPrice = watchedUnitPrice || 0;
    setCalculatedTotalCost(parseFloat((quantity * unitPrice).toFixed(2)));
  }, [watchedQuantity, watchedUnitPrice]);

  async function onSubmit(data: EntryFormValues) {
    setIsSubmitting(true);
    try {
      const selectedProduct = await getProductById(data.productId);
      const selectedSupplier = suppliersList.find(s => s.id === data.supplierId);

      if (!selectedProduct) {
        toast({ title: "Erro", description: "Produto selecionado não encontrado.", variant: "destructive"});
        setIsSubmitting(false);
        return;
      }
      if (!selectedSupplier) {
        toast({ title: "Erro", description: "Fornecedor selecionado não encontrado.", variant: "destructive"});
        setIsSubmitting(false);
        return;
      }

      const newEntry: Entry = {
        id: String(Date.now()),
        ...data,
        totalValue: parseFloat(((data.quantity || 0) * (data.unitPrice || 0)).toFixed(2)), 
        productName: selectedProduct.name,
        supplierName: selectedSupplier.supplierName,
      };

      await addEntry(newEntry);

      const updatedProductStock = {
        ...selectedProduct,
        stock: selectedProduct.stock + data.quantity
      };
      await updateProduct(updatedProductStock);

      toast({
        title: "Entrada Registrada!",
        description: `Entrada de ${data.quantity}x ${selectedProduct.name} do fornecedor ${selectedSupplier.supplierName} registrada. Estoque atualizado.`,
      });
      
      await fetchData(); 
      form.reset({
        date: new Date(),
        supplierId: "",
        productId: "",
        quantity: 1,
        unitPrice: 0,
      });
      setCalculatedTotalCost(0);

    } catch (error) {
      console.error("Failed to register entry:", error);
      toast({ title: "Erro ao Registrar Entrada", description: "Não foi possível salvar a entrada.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteClick = (entry: Entry) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEntry = async () => {
    if (entryToDelete) {
      setIsSubmitting(true);
      setShowDeleteConfirm(false);
      try {
        await deleteEntry(entryToDelete.id);
        const productToUpdate = await getProductById(entryToDelete.productId);
        if (productToUpdate) {
          const newStock = Math.max(0, productToUpdate.stock - entryToDelete.quantity); 
          await updateProduct({ ...productToUpdate, stock: newStock });
        }
        toast({
          title: "Entrada Excluída!",
          description: `A entrada de ${entryToDelete.productName} do fornecedor ${entryToDelete.supplierName || 'N/A'} foi removida. Estoque atualizado.`,
          variant: "destructive"
        });
        await fetchData();
      } catch (error) {
        console.error("Failed to delete entry:", error);
        toast({ title: "Erro ao Excluir Entrada", description: "Não foi possível excluir a entrada.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setEntryToDelete(null);
      }
    } else {
        setShowDeleteConfirm(false);
        setEntryToDelete(null);
    }
  };


  if (isLoading) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando dados...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <LogIn size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Registro de Compras (Custos)
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            Preencha o formulário para registrar novas compras de produtos para o estoque, incluindo seus custos de aquisição.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-primary-foreground/90">Data da Compra</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarLucideIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2000-01-01")
                          }
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Warehouse size={16} className="mr-2"/>Fornecedor</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliersList.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.supplierName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Package size={16} className="mr-2"/>Produto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90 flex items-center"><Hash size={16} className="mr-2"/>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitPrice" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90 flex items-center"><DollarSign size={16} className="mr-2"/>Custo Unitário (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} step="0.01" min="0.01"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel className="text-primary-foreground/90">Custo Total (R$)</FormLabel>
                <FormControl>
                    <Input type="text" value={calculatedTotalCost.toFixed(2)} readOnly disabled className="font-bold text-lg"/>
                </FormControl>
              </FormItem>

              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 btn-animated" disabled={isSubmitting}>
                {isSubmitting && !entryToDelete ? <Loader2 className="animate-spin" /> : <><PlusCircle size={18} className="mr-2" /> Registrar Compra</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card className="max-w-5xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-primary-foreground">Compras Registradas ({entries.length})</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Visualize as compras de produtos mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (<TableRow key={entry.id}><TableCell>{format(entry.date, "dd/MM/yyyy", { locale: ptBR })}</TableCell><TableCell>{entry.supplierName || entry.supplierId}</TableCell><TableCell>{entry.productName}</TableCell><TableCell className="text-right">{entry.quantity}</TableCell><TableCell className="text-right">R$ {entry.unitPrice.toFixed(2)}</TableCell><TableCell className="text-right font-medium">R$ {entry.totalValue.toFixed(2)}</TableCell><TableCell className="text-center"><Button variant="ghost" size="sm" onClick={() => handleDeleteClick(entry)} disabled={isSubmitting} className="text-destructive hover:text-destructive/80"><Trash2 size={16}/></Button></TableCell></TableRow>))}
              </TableBody>
               <TableCaption>Lista das últimas compras de produtos. "Custo Unit." refere-se ao custo de aquisição do produto.</TableCaption>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { if(!isSubmitting) setShowDeleteConfirm(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><Trash2 className="text-destructive mr-2"/>Confirmar Exclusão de Compra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta compra de "{entryToDelete?.productName}" do fornecedor "{entryToDelete?.supplierName || entryToDelete?.supplierId}"?
              Esta ação não pode ser desfeita e <strong className="text-destructive">ajustará o estoque do produto</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { if(!isSubmitting) setEntryToDelete(null);}} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEntry} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting && entryToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir Compra"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

