
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import type { Product } from "@/lib/types";
import { LayoutGrid, PackageSearch, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getStoredProducts } from "@/lib/storage";

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(getStoredProducts());
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'bananaBlissApp_products' || event.key === 'controleDocesApp_products') { // Adjusted for name change
        setProducts(getStoredProducts());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const getStockIndicatorColor = (stock: number) => {
    if (stock === 0) return "text-destructive";
    if (stock < 10) return "text-orange-500"; 
    return "text-green-600"; 
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <LayoutGrid size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Controle de Estoque
            </CardTitle>
          </div>
           <CardDescription className="text-primary-foreground/80">
            Visualize os níveis de estoque atuais dos seus produtos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagem</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço (R$)</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className={product.stock === 0 ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="relative w-16 h-16 rounded-md overflow-hidden">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          data-ai-hint={product.dataAiHint || "product photo"}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.category}</TableCell>
                    <TableCell className="text-right">{product.price.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-bold ${getStockIndicatorColor(product.stock)}`}>
                      {product.stock}
                      {product.stock > 0 && product.stock < 10 && <AlertTriangle className="inline-block ml-1 h-4 w-4" />}
                      {product.stock === 0 && <AlertTriangle className="inline-block ml-1 h-4 w-4 text-destructive" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Lista de produtos e seus respectivos níveis de estoque.</TableCaption>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <PackageSearch size={48} className="mx-auto mb-4" />
              <p className="text-lg">Nenhum produto encontrado no estoque.</p>
              <p className="text-sm">Cadastre produtos na tela de "Produtos" para visualizá-los aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
