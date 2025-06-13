
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
import { ArrowRightLeft, PlusCircle, DollarSign, Package, CalendarIcon as CalendarLucideIcon, Hash, User, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { products as allProducts } from "@/lib/products";
import type { Product, Sale, SaleFormValues } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const saleFormSchema = z.object({
  date: z.date({
    required_error: "A data da saída é obrigatória.",
  }),
  customer: z.string().min(2, {
    message: "O nome do cliente deve ter pelo menos 2 caracteres.",
  }).max(100, {
    message: "O nome do cliente não pode ter mais de 100 caracteres.",
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
  const [calculatedTotalValue, setCalculatedTotalValue] = useState<number>(0);
  const [selectedProductPrice, setSelectedProductPrice] = useState<number>(0);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      date: new Date(),
      customer: "",
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
    if (watchedProductId) {
      const product = allProducts.find(p => p.id === watchedProductId);
      if (product) {
        setSelectedProductPrice(product.price);
        form.setValue("unitPrice", product.price); 
      } else {
        setSelectedProductPrice(0);
        form.setValue("unitPrice", 0);
      }
    } else {
      setSelectedProductPrice(0);
      form.setValue("unitPrice", 0);
    }
  }, [watchedProductId, form]);

  useEffect(() => {
    const quantity = watchedQuantity || 0;
    const unitPrice = watchedUnitPrice || 0;
    const discount = watchedDiscount || 0;
    const subtotal = quantity * unitPrice;
    setCalculatedTotalValue(parseFloat(Math.max(0, subtotal - discount).toFixed(2)));
  }, [watchedQuantity, watchedUnitPrice, watchedDiscount]);
  

  function onSubmit(data: SaleFormValues) {
    const selectedProduct = allProducts.find(p => p.id === data.productId);

    if (!selectedProduct) {
        toast({ title: "Erro", description: "Produto não encontrado.", variant: "destructive" });
        return;
    }
    if (data.quantity > selectedProduct.stock) {
        toast({ title: "Estoque Insuficiente", description: `Apenas ${selectedProduct.stock} unidades de ${selectedProduct.name} disponíveis.`, variant: "destructive"});
        return;
    }
    
    const totalValue = (data.quantity * data.unitPrice) - data.discount;

    const newSale: Sale = {
      id: String(Date.now()), 
      ...data,
      totalValue: parseFloat(Math.max(0, totalValue).toFixed(2)),
      productName: selectedProduct?.name || "Produto Desconhecido",
    };
    setSales(prev => [newSale, ...prev]);

    // TODO: Implementar lógica de atualização de estoque aqui.
    // Por agora, apenas exibimos a mensagem.
    const updatedStock = selectedProduct.stock - data.quantity;
    toast({
      title: "Saída Registrada!",
      description: `Saída de ${data.quantity}x ${selectedProduct?.name || 'produto'} para ${data.customer} registrada. Novo estoque: ${updatedStock}. (Simulado)`,
    });

    form.reset({
      date: new Date(),
      customer: "",
      productId: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    });
    setCalculatedTotalValue(0);
    setSelectedProductPrice(0);
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={32} className="text-primary -scale-x-100" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Registro de Saída de Produtos
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            Preencha o formulário para registrar novas saídas (vendas) de produtos.
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
                    <FormLabel className="text-primary-foreground/90">Data da Saída</FormLabel>
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
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><User size={16} className="mr-2"/>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do Cliente" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allProducts.map((product) => (
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

              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
                <PlusCircle size={18} className="mr-2" /> Registrar Saída
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {sales.length > 0 && (
        <Card className="max-w-5xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-primary-foreground">Saídas Registradas ({sales.length})</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Visualize as saídas de produtos mais recentes.
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(sale.date, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.productName}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">R$ {sale.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {sale.discount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">R$ {sale.totalValue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
               <TableCaption>Lista das últimas saídas de produtos.</TableCaption>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
