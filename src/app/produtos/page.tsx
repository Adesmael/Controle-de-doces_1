
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, PlusCircle, Box, Image as ImageIcon, Lightbulb, Edit3, Trash2, Save, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/storage";
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

const productFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome do produto deve ter pelo menos 2 caracteres.",
  }).max(100, {
    message: "O nome do produto não pode ter mais de 100 caracteres.",
  }),
  category: z.string().min(2, {
    message: "A categoria deve ter pelo menos 2 caracteres.",
  }).max(50, {
    message: "A categoria não pode ter mais de 50 caracteres.",
  }),
  description: z.string().max(500, {
    message: "A descrição não pode ter mais de 500 caracteres.",
  }).optional(),
  stock: z.coerce.number().int().nonnegative({
    message: "O estoque deve ser um número inteiro não negativo.",
  }),
  imageUrl: z.string().url({
    message: "Por favor, insira uma URL válida para a imagem.",
  }).optional().or(z.literal('')),
  dataAiHint: z.string().max(50, {
    message: "Dica de IA para imagem muito longa (máx 50 caracteres)."
  }).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProdutosPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const storedProducts = await getProducts();
      setProducts(storedProducts.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({ title: "Erro ao carregar produtos", description: "Não foi possível buscar os produtos do banco de dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      stock: 0,
      imageUrl: "",
      dataAiHint: "",
    },
  });

  const resetFormAndState = () => {
    form.reset({
      name: "",
      category: "",
      description: "",
      stock: 0,
      imageUrl: "",
      dataAiHint: "",
    });
    setEditingProduct(null);
  };

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        const updatedProductData: Product = {
          ...editingProduct, // This carries over the existing price
          ...data, // Form data (name, category, description, stock, imageUrl, dataAiHint)
          imageUrl: data.imageUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(data.name)}`,
          dataAiHint: data.dataAiHint || data.name.split(" ").slice(0,2).join(" ").toLowerCase(),
        };
        await updateProduct(updatedProductData);
        toast({
          title: "Produto Atualizado!",
          description: `${updatedProductData.name} foi atualizado com sucesso.`,
        });
      } else {
        const newProductData: Product = {
            id: String(Date.now()),
            ...data, // Form data (name, category, description, stock, imageUrl, dataAiHint)
            price: 0, // Default selling price for new products
            imageUrl: data.imageUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(data.name)}`,
            dataAiHint: data.dataAiHint || data.name.split(" ").slice(0,2).join(" ").toLowerCase(),
        };
        await addProduct(newProductData);
        toast({
          title: "Produto Adicionado!",
          description: `${data.name} foi adicionado ao catálogo.`,
        });
      }
      await fetchProducts(); // Refetch products to update the list
      resetFormAndState();
    } catch (error) {
      console.error("Failed to save product:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o produto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      category: product.category,
      description: product.description,
      stock: product.stock,
      imageUrl: product.imageUrl.startsWith('https://placehold.co') && product.imageUrl.includes(encodeURIComponent(product.name)) ? '' : product.imageUrl,
      dataAiHint: product.dataAiHint,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      setIsSubmitting(true);
      try {
        await deleteProduct(productToDelete.id);
        toast({
          title: "Produto Excluído!",
          description: `${productToDelete.name} foi removido do catálogo.`,
          variant: "destructive"
        });
        await fetchProducts(); // Refetch products
        if (editingProduct && editingProduct.id === productToDelete?.id) {
            resetFormAndState();
        }
      } catch (error) {
        console.error("Failed to delete product:", error);
        toast({ title: "Erro ao Excluir", description: "Não foi possível excluir o produto.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setShowDeleteConfirm(false);
        setProductToDelete(null);
      }
    }
  };


  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <Package size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              {editingProduct ? "Editar Produto" : "Gerenciamento de Produtos"}
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            {editingProduct ? `Modifique os dados do produto ${editingProduct.name}. O preço de venda é gerenciado na tela de Saída.` : "Adicione e gerencie os produtos do seu catálogo. O preço de venda é definido na tela de Saída."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Package size={16} className="mr-2"/>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Doce de Banana Cremoso" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="Ex: Tradicional, Diet, Especial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90">Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalhes sobre o produto..." {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-foreground/90 flex items-center"><Box size={16} className="mr-2"/>Quantidade em Estoque</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} step="1" min="0"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90 flex items-center"><ImageIcon size={16} className="mr-2"/>URL da Imagem (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://exemplo.com/imagem.png" {...field} />
                      </FormControl>
                      <FormDescription>Se deixado em branco, uma imagem placeholder será usada.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="dataAiHint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90 flex items-center"><Lightbulb size={16} className="mr-2"/>Dica de IA para Imagem (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: doce banana, fruta tropical" {...field} />
                      </FormControl>
                      <FormDescription>Duas palavras chave para ajudar a encontrar uma imagem (ex: 'banana doce').</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-animated flex-grow sm:flex-grow-0" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingProduct ? <><Save size={18} className="mr-2" /> Salvar Alterações</> : <><PlusCircle size={18} className="mr-2" /> Adicionar Produto</>)}
                </Button>
                {editingProduct && (
                  <Button type="button" variant="outline" onClick={resetFormAndState} className="btn-animated flex-grow sm:flex-grow-0" disabled={isSubmitting}>
                    <XCircle size={18} className="mr-2" /> Cancelar Edição
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando produtos...</p></div>
      ) : products.length > 0 && (
        <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-primary-foreground">Produtos Cadastrados ({products.length})</CardTitle>
                 <CardDescription className="text-primary-foreground/80">
                    Visualize e gerencie os produtos atualmente no seu catálogo. O preço de venda é definido na tela de Saída.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card/80 hover:shadow-md transition-shadow">
                        <div className="relative w-full sm:w-32 h-32 sm:h-24 rounded-md overflow-hidden flex-shrink-0">
                           <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, 128px"
                                className="object-cover"
                                data-ai-hint={product.dataAiHint || "product image"}
                            />
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-lg font-semibold font-headline">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
                            {product.description && <p className="text-xs text-muted-foreground/80 mb-2 line-clamp-2">{product.description}</p>}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                <span className="text-muted-foreground">Estoque: {product.stock}</span>
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-0 flex-shrink-0 space-x-2 flex sm:flex-col sm:space-x-0 sm:space-y-2">
                           <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)} className="btn-animated w-full sm:w-auto" disabled={isSubmitting}>
                             <Edit3 size={14} className="mr-1 sm:mr-2"/> Editar
                           </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(product)} className="btn-animated w-full sm:w-auto" disabled={isSubmitting}>
                             <Trash2 size={14} className="mr-1 sm:mr-2"/> Excluir
                           </Button>
                        </div>
                    </Card>
                ))}
            </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><Trash2 className="text-destructive mr-2"/>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.name}"? Esta ação não pode ser desfeita e removerá o produto permanentemente do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProduct} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Excluir Produto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
