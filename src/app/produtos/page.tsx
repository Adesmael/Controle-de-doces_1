
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { Package, PlusCircle, DollarSign, Box, Image as ImageIcon, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { getStoredProducts, saveStoredProducts } from "@/lib/storage";

// Define the schema for the product form
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
  price: z.coerce.number().positive({
    message: "O preço deve ser um número positivo.",
  }).transform(val => parseFloat(val.toFixed(2))),
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

  useEffect(() => {
    setProducts(getStoredProducts());
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: 0,
      stock: 0,
      imageUrl: "",
      dataAiHint: "",
    },
  });

  function onSubmit(data: ProductFormValues) {
    const newProduct: Product = {
        id: String(Date.now()), 
        name: data.name,
        category: data.category,
        description: data.description || "",
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(data.name)}`,
        dataAiHint: data.dataAiHint || data.name.split(" ").slice(0,2).join(" ").toLowerCase(),
    };
    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    toast({
      title: "Produto Adicionado!",
      description: `${data.name} foi adicionado ao catálogo.`,
    });
    form.reset();
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <Package size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Gerenciamento de Produtos
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            Adicione e gerencie os produtos do seu catálogo.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90 flex items-center"><DollarSign size={16} className="mr-2"/>Preço Unitário (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15.99" {...field} step="0.01" min="0.01"/>
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
              </div>
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
              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
                <PlusCircle size={18} className="mr-2" /> Adicionar Produto
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {products.length > 0 && (
        <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-primary-foreground">Produtos Cadastrados ({products.length})</CardTitle>
                 <CardDescription className="text-primary-foreground/80">
                    Visualize os produtos atualmente no seu catálogo.
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
                                <span className="font-medium">Preço: R$ {product.price.toFixed(2)}</span>
                                <span className="text-muted-foreground">Estoque: {product.stock}</span>
                            </div>
                        </div>
                         {/* Placeholder para botões de ação (editar/excluir) */}
                        <div className="mt-2 sm:mt-0 flex-shrink-0">
                           {/* <Button variant="outline" size="sm" className="mr-2">Editar</Button>
                           <Button variant="destructive" size="sm">Excluir</Button> */}
                        </div>
                    </Card>
                ))}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
