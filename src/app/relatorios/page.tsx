
"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, Users, DollarSign, AlertTriangle, Info } from "lucide-react";
import { BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { getStoredSales, getStoredProducts } from "@/lib/storage";
import type { Sale, Product } from "@/lib/types";
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlySalesData {
  month: string;
  sales: number;
  yearMonth: string; 
}

interface ProductSalesData {
  name: string;
  sales: number; 
}

interface StockLevelData {
  name: string;
  stock: number;
}

interface SummaryMetrics {
  totalRevenue: number;
  activeCustomers: number;
  lowStockItemsCount: number;
}

const salesChartConfig = {
  sales: {
    label: "Vendas (R$)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const topProductsChartConfig = {
  sales: {
    label: "Unidades Vendidas",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

const stockChartConfig = {
  stock: {
    label: "Estoque",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig


export default function RelatoriosPage() {
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSalesData[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelData[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalRevenue: 0,
    activeCustomers: 0,
    lowStockItemsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadReportData = () => {
    setIsLoading(true);
    const sales = getStoredSales();
    const products = getStoredProducts();

    const monthlySalesAgg: { [key: string]: number } = {};
    const sixMonthsAgo = subMonths(new Date(), 5); 

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate >= sixMonthsAgo) {
        const monthYearKey = format(saleDate, "yyyy-MM");
        monthlySalesAgg[monthYearKey] = (monthlySalesAgg[monthYearKey] || 0) + sale.totalValue;
      }
    });
    
    const processedMonthlySales: MonthlySalesData[] = Object.entries(monthlySalesAgg)
      .map(([key, total]) => ({
        yearMonth: key,
        month: format(new Date(key + '-02'), "MMM/yy", { locale: ptBR }), 
        sales: total,
      }))
      .sort((a,b) => a.yearMonth.localeCompare(b.yearMonth)); 
    setMonthlySales(processedMonthlySales);

    const productSalesAgg: { [productId: string]: number } = {};
    sales.forEach(sale => {
      productSalesAgg[sale.productId] = (productSalesAgg[sale.productId] || 0) + sale.quantity;
    });

    const processedTopProducts: ProductSalesData[] = Object.entries(productSalesAgg)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          name: product?.name || `Produto ID ${productId}`,
          sales: quantity,
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); 
    setTopProducts(processedTopProducts);

    const processedStockLevels: StockLevelData[] = products
      .sort((a,b) => a.stock - b.stock) 
      .slice(0, 5) 
      .map(product => ({
        name: product.name,
        stock: product.stock,
      }));
    setStockLevels(processedStockLevels);
    
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const uniqueCustomers = new Set(sales.map(sale => sale.customer.toLowerCase().trim()));
    const lowStockItemsCount = products.filter(p => p.stock < 10 && p.stock > 0).length; 

    setSummaryMetrics({
      totalRevenue,
      activeCustomers: uniqueCustomers.size,
      lowStockItemsCount,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    loadReportData();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'bananaBlissApp_sales' || event.key === 'bananaBlissApp_products' || event.key === 'bananaBlissApp_entries') {
            loadReportData();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  const renderChartOrMessage = (data: any[], chartComponent: React.ReactNode, message: string) => {
    if (isLoading) {
      return <p className="text-center text-muted-foreground py-10">Carregando dados...</p>;
    }
    if (data.length === 0) {
      return <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                <Info size={32} className="mb-2"/> 
                <p>{message}</p>
            </div>;
    }
    return chartComponent;
  };


  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <BarChart3 size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Painel de Relatórios Gerenciais
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            Acompanhe as métricas chave do seu negócio.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />Vendas Mensais (R$)
              </CardTitle>
              <CardDescription>Total de vendas nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]"> 
              {renderChartOrMessage(monthlySales,
                <ChartContainer config={salesChartConfig} className="h-full w-full">
                  <BarChart accessibilityLayer data={monthlySales}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis tickFormatter={(value) => `R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                  </BarChart>
                </ChartContainer>,
                "Nenhuma venda registrada nos últimos 6 meses para exibir o gráfico."
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Package size={20} className="text-accent" />Produtos Mais Vendidos
              </CardTitle>
              <CardDescription>Ranking dos 5 produtos mais vendidos (unidades).</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {renderChartOrMessage(topProducts,
                <ChartContainer config={topProductsChartConfig} className="h-full w-full">
                    <BarChart accessibilityLayer data={topProducts} layout="vertical">
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={120} interval={0} />
                        <XAxis dataKey="sales" type="number" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                    </BarChart>
                </ChartContainer>,
                "Nenhuma venda registrada para exibir os produtos mais vendidos."
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" />Níveis de Estoque (Top 5 Baixos/Primeiros)
              </CardTitle>
              <CardDescription>Visão geral do estoque de alguns produtos.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {renderChartOrMessage(stockLevels,
                <ChartContainer config={stockChartConfig} className="h-full w-full">
                    <BarChart accessibilityLayer data={stockLevels}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            interval={0}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="stock" fill="var(--color-stock)" radius={4} />
                    </BarChart>
                </ChartContainer>,
                "Nenhum produto cadastrado para exibir níveis de estoque."
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Vendas (Geral)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">R$ {summaryMetrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">Valor total de todas as vendas registradas.</p>
                </CardContent>
            </Card>
            <Card className="bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryMetrics.activeCustomers}</div>
                    <p className="text-xs text-muted-foreground">Número de clientes únicos que compraram.</p>
                </CardContent>
            </Card>
             <Card className="bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Itens em Estoque Baixo</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryMetrics.lowStockItemsCount} Produto(s)</div>
                    <p className="text-xs text-muted-foreground">Produtos com menos de 10 unidades em estoque.</p>
                </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
