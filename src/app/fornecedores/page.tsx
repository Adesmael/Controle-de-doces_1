
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck, PlusCircle, Edit3, Trash2, Save, XCircle, Loader2, Warehouse, CalendarIcon as CalendarLucideIcon, Package as PackageIcon, MapPin, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Supplier, SupplierFormValues } from "@/lib/types";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "@/lib/storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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

const supplierFormSchema = z.object({
  registrationDate: z.date({
    required_error: "A data de cadastro é obrigatória.",
  }),
  supplierName: z.string().min(2, {
    message: "O nome do fornecedor deve ter pelo menos 2 caracteres.",
  }).max(150, { message: "Máximo de 150 caracteres."}),
  address: z.string().min(5, {
    message: "O endereço deve ter pelo menos 5 caracteres.",
  }).max(150, { message: "Máximo de 150 caracteres."}),
  neighborhood: z.string().min(2, {
    message: "O bairro deve ter pelo menos 2 caracteres.",
  }).max(100, { message: "Máximo de 100 caracteres."}),
  city: z.string().min(2, {
    message: "A cidade deve ter pelo menos 2 caracteres.",
  }).max(100, { message: "Máximo de 100 caracteres."}),
  phone: z.string().min(8, {
    message: "O telefone deve ter pelo menos 8 dígitos.",
  }).max(20, { message: "Máximo de 20 caracteres."}),
  suppliedProducts: z.string().min(3, {
    message: "Informe os produtos fornecidos (mínimo 3 caracteres)."
  }).max(500, { message: "Máximo de 500 caracteres para produtos."}),
});

export default function FornecedoresPage() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const storedSuppliers = await getSuppliers();
      setSuppliers(storedSuppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      toast({ title: "Erro ao carregar fornecedores", description: "Não foi possível buscar os fornecedores.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      registrationDate: new Date(),
      supplierName: "",
      address: "",
      neighborhood: "",
      city: "",
      phone: "",
      suppliedProducts: "",
    },
  });

  const resetFormAndState = () => {
    form.reset({
      registrationDate: new Date(),
      supplierName: "",
      address: "",
      neighborhood: "",
      city: "",
      phone: "",
      suppliedProducts: "",
    });
    setEditingSupplier(null);
  };

  async function onSubmit(data: SupplierFormValues) {
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        const updatedSupplierData: Supplier = { ...editingSupplier, ...data };
        await updateSupplier(updatedSupplierData);
        toast({
          title: "Fornecedor Atualizado!",
          description: `${updatedSupplierData.supplierName} foi atualizado com sucesso.`,
        });
      } else {
        const newSupplierData: Supplier = { id: String(Date.now()), ...data };
        await addSupplier(newSupplierData);
        toast({
          title: "Fornecedor Adicionado!",
          description: `${data.supplierName} foi adicionado com sucesso.`,
        });
      }
      await fetchSuppliers();
      resetFormAndState();
    } catch (error) {
      console.error("Failed to save supplier:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o fornecedor.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
        ...supplier,
        registrationDate: new Date(supplier.registrationDate) // Ensure date is a Date object
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSupplier = async () => {
    if (supplierToDelete) {
      setIsSubmitting(true);
      try {
        await deleteSupplier(supplierToDelete.id);
        toast({
          title: "Fornecedor Excluído!",
          description: `${supplierToDelete.supplierName} foi removido.`,
          variant: "destructive"
        });
        await fetchSuppliers();
        if (editingSupplier && editingSupplier.id === supplierToDelete?.id) {
            resetFormAndState();
        }
      } catch (error) {
        console.error("Failed to delete supplier:", error);
        toast({ title: "Erro ao Excluir", description: "Não foi possível excluir o fornecedor.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setShowDeleteConfirm(false);
        setSupplierToDelete(null);
      }
    }
  };
  
  if (isLoading && !suppliers.length) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando fornecedores...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <Truck size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              {editingSupplier ? "Editar Fornecedor" : "Cadastro de Fornecedores"}
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            {editingSupplier ? `Modifique os dados do fornecedor ${editingSupplier.supplierName}.` : "Adicione e gerencie seus fornecedores."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="registrationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-primary-foreground/90 flex items-center"><CalendarLucideIcon size={16} className="mr-2"/>Data de Cadastro</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                          >
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
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Warehouse size={16} className="mr-2"/>Nome do Fornecedor</FormLabel>
                    <FormControl><Input placeholder="Nome da empresa fornecedora" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><MapPin size={16} className="mr-2"/>Endereço</FormLabel>
                    <FormControl><Input placeholder="Rua, Número, Complemento" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-primary-foreground/90">Bairro</FormLabel>
                        <FormControl><Input placeholder="Bairro" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-primary-foreground/90">Cidade</FormLabel>
                        <FormControl><Input placeholder="Cidade" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Phone size={16} className="mr-2"/>Telefone</FormLabel>
                    <FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suppliedProducts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><PackageIcon size={16} className="mr-2"/>Produtos Fornecidos</FormLabel>
                    <FormControl><Textarea placeholder="Descreva os principais produtos ou tipos de produtos fornecidos" {...field} className="min-h-[80px]"/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-animated flex-grow sm:flex-grow-0" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingSupplier ? <><Save size={18} className="mr-2" /> Salvar</> : <><PlusCircle size={18} className="mr-2" /> Adicionar Fornecedor</>)}
                </Button>
                {editingSupplier && (
                  <Button type="button" variant="outline" onClick={resetFormAndState} className="btn-animated flex-grow sm:flex-grow-0" disabled={isSubmitting}>
                    <XCircle size={18} className="mr-2" /> Cancelar Edição
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && suppliers.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
            Carregando fornecedores...
        </div>
      )}

      {!isLoading && suppliers.length === 0 && (
         <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-6 text-center text-muted-foreground">
                <Truck size={40} className="mx-auto mb-3"/>
                <p className="text-lg">Nenhum fornecedor cadastrado ainda.</p>
                <p className="text-sm">Use o formulário acima para adicionar seu primeiro fornecedor.</p>
            </CardContent>
        </Card>
      )}

      {suppliers.length > 0 && (
        <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-primary-foreground">Fornecedores Cadastrados ({suppliers.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Produtos Principais</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.city}</TableCell>
                        <TableCell className="max-w-xs truncate">{supplier.suppliedProducts}</TableCell>
                        <TableCell className="text-center space-x-1">
                           <Button variant="outline" size="sm" onClick={() => handleEditSupplier(supplier)} className="btn-animated" disabled={isSubmitting}>
                             <Edit3 size={14}/>
                           </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(supplier)} className="btn-animated" disabled={isSubmitting}>
                             <Trash2 size={14}/>
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>Lista de fornecedores cadastrados.</TableCaption>
                </Table>
            </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><Trash2 className="text-destructive mr-2"/>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{supplierToDelete?.supplierName}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {if(!isSubmitting) setSupplierToDelete(null)}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSupplier} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Excluir Fornecedor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
