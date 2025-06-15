
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import type { Product, Entry, Sale } from "@/lib/types";
import { LayoutGrid, PackageSearch, AlertTriangle, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { getProducts, getEntries, getSales } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface ProductStockInfo extends Product {
  totalEntries: number;
  totalSales: number;
}

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [storedProducts, storedEntries, storedSales] = await Promise.all([
          getProducts(),
          getEntries(),
          getSales()
        ]);
        setProducts(storedProducts.sort((a, b) => a.name.localeCompare(b.name)));
        setEntries(storedEntries.map(e => ({...e, date: new Date(e.date)})));
        setSales(storedSales.map(s => ({...s, date: new Date(s.date)})));
      } catch (error) {
        console.error("Failed to fetch data for stock page:", error);
        toast({ title: "Erro ao Carregar Dados", description: "Não foi possível buscar os dados para o estoque.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productStockDetails: ProductStockInfo[] = useMemo(() => {
    return products.map(product => {
      const productEntries = entries.filter(entry => entry.productId === product.id);
      const totalEntries = productEntries.reduce((sum, entry) => sum + entry.quantity, 0);

      const productSales = sales.filter(sale => sale.productId === product.id);
      const totalSales = productSales.reduce((sum, sale) => sum + sale.quantity, 0);

      return {
        ...product,
        totalEntries,
        totalSales,
      };
    });
  }, [products, entries, sales]);

  const getStockIndicatorColor = (stock: number) => {
    if (stock === 0) return "text-destructive";
    if (stock < 10) return "text-orange-500"; // Using a Tailwind orange, ensure it's defined or use a suitable alternative
    return "text-green-600"; // Using a Tailwind green
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando estoque...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-5xl mx-auto shadow-xl"> {/* Increased max-width for more columns */}
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <LayoutGrid size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Controle de Estoque
            </CardTitle>
          </div>
           <CardDescription className="text-primary-foreground/80">
            Visualize os níveis de estoque atuais, total de entradas e saídas dos seus produtos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {productStockDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] min-w-[80px]">Imagem</TableHead>
                    <TableHead className="min-w-[150px]">Produto</TableHead>
                    <TableHead className="min-w-[100px]">Categoria</TableHead>
                    <TableHead className="text-right min-w-[120px]">Total Entradas</TableHead>
                    <TableHead className="text-right min-w-[100px]">Total Saídas</TableHead>
                    <TableHead className="text-right min-w-[120px]">Estoque Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productStockDetails.map((product) => (<TableRow key={product.id} className={product.stock === 0 ? "opacity-60" : ""}><TableCell><div className="relative w-16 h-16 rounded-md overflow-hidden"><Image src={product.imageUrl} alt={product.name} fill sizes="64px" className="object-cover" data-ai-hint={product.dataAiHint || "product photo"}/></div></TableCell><TableCell className="font-medium">{product.name}</TableCell><TableCell className="text-muted-foreground">{product.category}</TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-1 text-blue-600">{product.totalEntries} <ArrowUpCircle size={16}/></div></TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-1 text-red-600">{product.totalSales} <ArrowDownCircle size={16}/></div></TableCell><TableCell className={`text-right font-bold ${getStockIndicatorColor(product.stock)}`}>{product.stock}{product.stock > 0 && product.stock < 10 && <AlertTriangle className="inline-block ml-1 h-4 w-4" />}{product.stock === 0 && <AlertTriangle className="inline-block ml-1 h-4 w-4 text-destructive" />}</TableCell></TableRow>))}
                </TableBody>
                <TableCaption>
                  Lista de produtos com totais de entradas, saídas e níveis de estoque atuais.
                  O "Estoque Atual" deve ser (Total Entradas - Total Saídas) se todas as movimentações forem registradas corretamente.
                </TableCaption>
              </Table>
            </div>
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
