
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import type { Product } from "@/lib/types";
import { LayoutGrid, PackageSearch, AlertTriangle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getProducts } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const storedProducts = await getProducts();
      setProducts(storedProducts.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to fetch products for stock page:", error);
      toast({ title: "Erro ao Carregar Estoque", description: "Não foi possível buscar os produtos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Since IndexedDB doesn't have a native cross-tab sync event like localStorage,
    // we might need a more complex solution for real-time updates across tabs (e.g., BroadcastChannel or polling).
    // For now, data is fetched on component mount. A manual refresh or navigation might be needed to see changes from other tabs.
    // Consider adding a refresh button or periodic refetch if live cross-tab updates are critical.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const getStockIndicatorColor = (stock: number) => {
    if (stock === 0) return "text-destructive";
    if (stock < 10) return "text-orange-500";
    return "text-green-600";
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando estoque...</p></div>;
  }

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
            Visualize os níveis de estoque atuais dos seus produtos. O preço de venda é gerenciado na tela de Produtos e Saídas.
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
                  {/* Price column removed as per request */}
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
                    {/* Price cell removed */}
                    <TableCell className={`text-right font-bold ${getStockIndicatorColor(product.stock)}`}>
                      {product.stock}
                      {product.stock > 0 && product.stock < 10 && <AlertTriangle className="inline-block ml-1 h-4 w-4" />}
                      {product.stock === 0 && <AlertTriangle className="inline-block ml-1 h-4 w-4 text-destructive" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Lista de produtos e seus respectivos níveis de estoque. O custo de aquisição é gerenciado na tela de "Entrada".</TableCaption>
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
