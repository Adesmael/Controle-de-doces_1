
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, PlusCircle, Edit3, Trash2, Save, XCircle, Loader2, Building, CalendarIcon as CalendarLucideIcon, Tag, MapPin, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Client, ClientFormValues } from "@/lib/types";
import { getClients, addClient, updateClient, deleteClient } from "@/lib/storage";
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

const clientFormSchema = z.object({
  registrationDate: z.date({
    required_error: "A data de cadastro é obrigatória.",
  }),
  companyName: z.string().min(2, {
    message: "A razão social deve ter pelo menos 2 caracteres.",
  }).max(150, { message: "Máximo de 150 caracteres."}),
  tradingName: z.string().min(2, {
    message: "O nome fantasia deve ter pelo menos 2 caracteres.",
  }).max(100, { message: "Máximo de 100 caracteres."}),
  category: z.string().min(2, {
    message: "A categoria deve ter pelo menos 2 caracteres.",
  }).max(50, { message: "Máximo de 50 caracteres."}),
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
});

export default function ClientesPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const storedClients = await getClients();
      setClients(storedClients);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast({ title: "Erro ao carregar clientes", description: "Não foi possível buscar os clientes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      registrationDate: new Date(),
      companyName: "",
      tradingName: "",
      category: "",
      address: "",
      neighborhood: "",
      city: "",
      phone: "",
    },
  });

  const resetFormAndState = () => {
    form.reset({
      registrationDate: new Date(),
      companyName: "",
      tradingName: "",
      category: "",
      address: "",
      neighborhood: "",
      city: "",
      phone: "",
    });
    setEditingClient(null);
  };

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true);
    try {
      if (editingClient) {
        const updatedClientData: Client = { ...editingClient, ...data };
        await updateClient(updatedClientData);
        toast({
          title: "Cliente Atualizado!",
          description: `${updatedClientData.tradingName} foi atualizado com sucesso.`,
        });
      } else {
        const newClientData: Client = { id: String(Date.now()), ...data };
        await addClient(newClientData);
        toast({
          title: "Cliente Adicionado!",
          description: `${data.tradingName} foi adicionado com sucesso.`,
        });
      }
      await fetchClients();
      resetFormAndState();
    } catch (error) {
      console.error("Failed to save client:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o cliente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    form.reset({
        ...client,
        registrationDate: new Date(client.registrationDate) // Ensure date is a Date object
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteClient = async () => {
    if (clientToDelete) {
      setIsSubmitting(true);
      try {
        await deleteClient(clientToDelete.id);
        toast({
          title: "Cliente Excluído!",
          description: `${clientToDelete.tradingName} foi removido.`,
          variant: "destructive"
        });
        await fetchClients();
        if (editingClient && editingClient.id === clientToDelete?.id) {
            resetFormAndState();
        }
      } catch (error) {
        console.error("Failed to delete client:", error);
        toast({ title: "Erro ao Excluir", description: "Não foi possível excluir o cliente.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setShowDeleteConfirm(false);
        setClientToDelete(null);
      }
    }
  };

  if (isLoading && !clients.length) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando clientes...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <Users size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              {editingClient ? "Editar Cliente" : "Cadastro de Clientes"}
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            {editingClient ? `Modifique os dados do cliente ${editingClient.tradingName}.` : "Adicione e gerencie seus clientes."}
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
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Building size={16} className="mr-2"/>Razão Social</FormLabel>
                    <FormControl><Input placeholder="Nome completo da empresa" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tradingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Building size={16} className="mr-2"/>Nome Fantasia</FormLabel>
                    <FormControl><Input placeholder="Nome popular da empresa" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Tag size={16} className="mr-2"/>Categoria</FormLabel>
                    <FormControl><Input placeholder="Ex: Varejo, Restaurante" {...field} /></FormControl>
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
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-animated flex-grow sm:flex-grow-0" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingClient ? <><Save size={18} className="mr-2" /> Salvar</> : <><PlusCircle size={18} className="mr-2" /> Adicionar Cliente</>)}
                </Button>
                {editingClient && (
                  <Button type="button" variant="outline" onClick={resetFormAndState} className="btn-animated flex-grow sm:flex-grow-0" disabled={isSubmitting}>
                    <XCircle size={18} className="mr-2" /> Cancelar Edição
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && clients.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
            Carregando clientes...
        </div>
      )}

      {!isLoading && clients.length === 0 && (
         <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-6 text-center text-muted-foreground">
                <Users size={40} className="mx-auto mb-3"/>
                <p className="text-lg">Nenhum cliente cadastrado ainda.</p>
                <p className="text-sm">Use o formulário acima para adicionar seu primeiro cliente.</p>
            </CardContent>
        </Card>
      )}
      
      {clients.length > 0 && (
        <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-primary-foreground">Clientes Cadastrados ({clients.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.tradingName}</TableCell>
                        <TableCell>{client.companyName}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.city}</TableCell>
                        <TableCell className="text-center space-x-1">
                           <Button variant="outline" size="sm" onClick={() => handleEditClient(client)} className="btn-animated" disabled={isSubmitting}>
                             <Edit3 size={14}/>
                           </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(client)} className="btn-animated" disabled={isSubmitting}>
                             <Trash2 size={14}/>
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>Lista de clientes cadastrados.</TableCaption>
                </Table>
            </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><Trash2 className="text-destructive mr-2"/>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.tradingName}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {if(!isSubmitting) setClientToDelete(null)}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClient} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Excluir Cliente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
