
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
import { ArrowRightLeft, PlusCircle, DollarSign, Package, CalendarIcon as CalendarLucideIcon, Hash, User, Percent, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Sale, SaleFormValues, Client } from "@/lib/types"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getProducts, getSales, addSale, getProductById, updateProduct, deleteSale, getClients } from "@/lib/storage"; 
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

const saleFormSchema = z.object({
  date: z.date({
    required_error: "A data da saída é obrigatória.",
  }),
  clientId: z.string().min(1, { 
    message: "Selecione um cliente.",
  }),
  productId: z.string().min(1, {
    message: "Selecione um produto.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "A quantidade deve ser um número inteiro positivo.",
  }),
  unitPrice: z.coerce.number().positive({
    message: "O valor unitário deve ser um número positivo.",
  }).transform(val => parseFloat(val.toFixed(2))),
  discount: z.coerce.number().nonnegative({
    message: "O desconto deve ser um número não negativo (0 se não houver desconto).",
  }).default(0).transform(val => parseFloat(val.toFixed(2))),
});


export default function SaidaPage() {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]); 
  const [calculatedTotalValue, setCalculatedTotalValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [storedProducts, storedSales, storedClients] = await Promise.all([ 
        getProducts(),
        getSales(),
        getClients() 
      ]);
      setProducts(storedProducts.sort((a,b) => a.name.localeCompare(b.name)));
      setSales(storedSales.map(s => ({...s, date: new Date(s.date)}))); 
      setClientsList(storedClients.sort((a,b) => (a.tradingName || a.companyName).localeCompare(b.tradingName || b.companyName))); 
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Erro ao Carregar Dados", description: "Não foi possível buscar produtos, saídas ou clientes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      date: new Date(),
      clientId: "", 
      productId: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    },
  });

  const watchedProductId = form.watch("productId");
  const watchedQuantity = form.watch("quantity");
  const watchedUnitPrice = form.watch("unitPrice");
  const watchedDiscount = form.watch("discount");

  useEffect(() => {
    const updatePriceFromProduct = async () => {
      if (watchedProductId) {
        const product = products.find(p => p.id === watchedProductId); 
        if (product) {
          form.setValue("unitPrice", product.price);
        } else {
          const fetchedProduct = await getProductById(watchedProductId);
          if (fetchedProduct) {
            form.setValue("unitPrice", fetchedProduct.price);
          } else {
            form.setValue("unitPrice", 0);
          }
        }
      } else {
        form.setValue("unitPrice", 0);
      }
    };
    updatePriceFromProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedProductId, products]); 

  useEffect(() => {
    const quantity = watchedQuantity || 0;
    const unitPrice = watchedUnitPrice || 0;
    const discount = watchedDiscount || 0;
    const subtotal = quantity * unitPrice;
    setCalculatedTotalValue(parseFloat(Math.max(0, subtotal - discount).toFixed(2)));
  }, [watchedQuantity, watchedUnitPrice, watchedDiscount]);


  async function onSubmit(data: SaleFormValues) {
    setIsSubmitting(true);
    try {
      const selectedProduct = await getProductById(data.productId);
      const selectedClient = clientsList.find(c => c.id === data.clientId); 

      if (!selectedProduct) {
          toast({ title: "Erro", description: "Produto não encontrado.", variant: "destructive" });
          setIsSubmitting(false);
          return;
      }
      if (!selectedClient) { 
          toast({ title: "Erro", description: "Cliente não encontrado.", variant: "destructive" });
          setIsSubmitting(false);
          return;
      }
      if (data.quantity > selectedProduct.stock) {
          toast({ title: "Estoque Insuficiente", description: `Apenas ${selectedProduct.stock} unidades de ${selectedProduct.name} disponíveis.`, variant: "destructive"});
          setIsSubmitting(false);
          return;
      }

      const totalValue = (data.quantity * data.unitPrice) - data.discount;

      const newSale: Sale = {
        id: String(Date.now()),
        date: data.date,
        clientId: data.clientId,
        customerName: selectedClient.tradingName || selectedClient.companyName, 
        productId: data.productId,
        productName: selectedProduct.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discount: data.discount,
        totalValue: parseFloat(Math.max(0, totalValue).toFixed(2)),
      };

      await addSale(newSale);

      const updatedProductStock = {
        ...selectedProduct,
        stock: selectedProduct.stock - data.quantity
      };
      await updateProduct(updatedProductStock);

      toast({
        title: "Venda Registrada!",
        description: `Venda de ${data.quantity}x ${selectedProduct.name} para ${selectedClient.tradingName || selectedClient.companyName} registrada. Estoque atualizado.`,
      });

      await fetchData(); 
      form.reset({
        date: new Date(),
        clientId: "", 
        productId: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
      });
      setCalculatedTotalValue(0);

    } catch (error) {
      console.error("Failed to register sale:", error);
      toast({ title: "Erro ao Registrar Venda", description: "Não foi possível salvar a venda.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSale = async () => {
    if (saleToDelete) {
      setIsSubmitting(true);
      setShowDeleteConfirm(false);
      try {
        await deleteSale(saleToDelete.id);
        const productToUpdate = await getProductById(saleToDelete.productId);
        if (productToUpdate) {
          await updateProduct({ ...productToUpdate, stock: productToUpdate.stock + saleToDelete.quantity });
        }
        toast({
          title: "Venda Excluída!",
          description: `A venda de ${saleToDelete.productName} foi removida. Estoque atualizado.`,
          variant: "destructive"
        });
        await fetchData();
      } catch (error) {
        console.error("Failed to delete sale:", error);
        toast({ title: "Erro ao Excluir Venda", description: "Não foi possível excluir a venda.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setSaleToDelete(null);
      }
    } else {
        setShowDeleteConfirm(false);
        setSaleToDelete(null);
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
            <ArrowRightLeft size={32} className="text-primary -scale-x-100" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Registro de Vendas de Produtos
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            Preencha o formulário para registrar novas vendas de produtos.
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
                    <FormLabel className="text-primary-foreground/90">Data da Venda</FormLabel>
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
                name="clientId" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><User size={16} className="mr-2"/>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue="">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientsList.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.tradingName || client.companyName}
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
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue="">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id} disabled={product.stock <= 0}>
                            {product.name} (Estoque: {product.stock})
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
                      <FormLabel className="text-primary-foreground/90 flex items-center"><DollarSign size={16} className="mr-2"/>Valor Unitário (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} step="0.01" min="0.01"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Percent size={16} className="mr-2"/>Desconto (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} step="0.01" min="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel className="text-primary-foreground/90">Valor Total (R$)</FormLabel>
                <FormControl>
                    <Input type="text" value={calculatedTotalValue.toFixed(2)} readOnly disabled className="font-bold text-lg"/>
                </FormControl>
              </FormItem>

              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 btn-animated" disabled={isSubmitting}>
                 {isSubmitting && !saleToDelete ? <Loader2 className="animate-spin" /> : <><PlusCircle size={18} className="mr-2" /> Registrar Venda</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {sales.length > 0 && (
        <Card className="max-w-5xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-primary-foreground">Vendas Registradas ({sales.length})</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Visualize as vendas de produtos mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Vlr. Unit.</TableHead>
                  <TableHead className="text-right">Desc.</TableHead>
                  <TableHead className="text-right">Vlr. Total</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (<TableRow key={sale.id}><TableCell>{format(sale.date, "dd/MM/yyyy", { locale: ptBR })}</TableCell><TableCell>{sale.customerName || sale.clientId}</TableCell><TableCell>{sale.productName}</TableCell><TableCell className="text-right">{sale.quantity}</TableCell><TableCell className="text-right">R$ {sale.unitPrice.toFixed(2)}</TableCell><TableCell className="text-right">R$ {sale.discount.toFixed(2)}</TableCell><TableCell className="text-right font-medium">R$ {sale.totalValue.toFixed(2)}</TableCell><TableCell className="text-center"><Button variant="ghost" size="sm" onClick={() => handleDeleteClick(sale)} disabled={isSubmitting} className="text-destructive hover:bg-destructive/80"><Trash2 size={16}/></Button></TableCell></TableRow>))}
              </TableBody>
               <TableCaption>Lista das últimas vendas de produtos.</TableCaption>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { if(!isSubmitting) setShowDeleteConfirm(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><Trash2 className="text-destructive mr-2"/>Confirmar Exclusão de Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda de "{saleToDelete?.productName}" para o cliente "{saleToDelete?.customerName || saleToDelete?.clientId}"?
              Esta ação não pode ser desfeita e <strong className="text-destructive">ajustará o estoque do produto</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { if(!isSubmitting) setSaleToDelete(null);}} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSale} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting && saleToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir Venda"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

