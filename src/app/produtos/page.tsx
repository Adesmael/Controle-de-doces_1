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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Product } from "@/lib/types"; // Assuming Product type is defined here

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
  // Add other fields from Product type as needed, for now just name and category
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Dummy list to store products for now
const initialProducts: Partial<Product>[] = [
    { id: "1", name: "Doce de Banana Cremoso", category: "Tradicional" },
    { id: "2", name: "Bananada Barra", category: "Barra" },
];


export default function ProdutosPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Partial<Product>[]>(initialProducts);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "",
    },
  });

  function onSubmit(data: ProductFormValues) {
    // In a real app, you would send this data to your backend
    const newProduct: Partial<Product> = {
        id: String(Date.now()), // simple unique ID
        name: data.name,
        category: data.category,
        // You might want to add default values for other product properties here
        // e.g. price: 0, stock: 0, imageUrl: 'https://placehold.co/...'
    };
    setProducts(prev => [...prev, newProduct]);

    toast({
      title: "Produto Adicionado!",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
    form.reset(); // Reset form fields after submission
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <Package size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Gerenciamento de Produtos
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            Adicione novos produtos ao seu catálogo.
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
                    <FormLabel className="text-primary-foreground/90">Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Doce de Banana Cremoso" {...field} />
                    </FormControl>
                    <FormDescription>
                      O nome completo do seu produto.
                    </FormDescription>
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
                    <FormDescription>
                      A categoria à qual este produto pertence.
                    </FormDescription>
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
        <Card className="max-w-2xl mx-auto shadow-lg mt-8">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-primary-foreground">Produtos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {products.map((product) => (
                        <li key={product.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                            <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.category}</p>
                            </div>
                            {/* Add edit/delete buttons here later if needed */}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
