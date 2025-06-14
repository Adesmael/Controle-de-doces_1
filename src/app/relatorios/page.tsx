
"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { BarChart3, TrendingUp, Package, Users, DollarSign, Info, FileText, TrendingDown, Loader2, CalendarDays, Receipt, ShoppingBag } from "lucide-react";
import { BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { getSales, getProducts, getEntries } from "@/lib/storage";
import type { Sale, Product, Entry, SalesProfitData } from "@/lib/types";
import { format, subMonths, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


interface MonthlySalesData {
  month: string;
  sales: number;
  yearMonth: string;
}

interface DailySalesData {
  dateDisplay: string; 
  fullDate: string; 
  sales: number;
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
  totalCostOfGoodsSold: number;
  totalProfitAllProducts: number;
  activeCustomers: number;
  lowStockItemsCount: number;
  totalUnitsSold: number;
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

const dailySalesChartConfig = {
  sales: {
    label: "Vendas Diárias (R$)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig


export default function RelatoriosPage() {
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSalesData[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelData[]>([]);
  const [salesProfitData, setSalesProfitData] = useState<SalesProfitData[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalRevenue: 0,
    totalCostOfGoodsSold: 0,
    totalProfitAllProducts: 0,
    activeCustomers: 0,
    lowStockItemsCount: 0,
    totalUnitsSold: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasIncompleteCosting, setHasIncompleteCosting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [salesFromDB, products, entriesFromDB] = await Promise.all([
        getSales(),
        getProducts(),
        getEntries()
      ]);

      const entries = entriesFromDB.map(e => ({...e, date: new Date(e.date)}));
      const allSales = salesFromDB.map(s => ({...s, date: new Date(s.date)}));

      const sortedEntries = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());

      const monthlySalesAgg: { [key: string]: number } = {};
      const sixMonthsAgo = subMonths(new Date(), 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0,0,0,0);

      allSales.forEach(sale => {
        const saleDate = sale.date;
        if (saleDate.getTime() >= sixMonthsAgo.getTime()) {
          const monthYearKey = format(saleDate, "yyyy-MM");
          monthlySalesAgg[monthYearKey] = (monthlySalesAgg[monthYearKey] || 0) + sale.totalValue;
        }
      });

      const processedMonthlySales: MonthlySalesData[] = Object.entries(monthlySalesAgg)
        .map(([key, total]) => ({
          yearMonth: key,
          month: format(new Date(key + '-02T00:00:00Z'), "MMM/yy", { locale: ptBR }),
          sales: total,
        }))
        .sort((a,b) => a.yearMonth.localeCompare(b.yearMonth));
      setMonthlySales(processedMonthlySales);

      const dailySalesAgg: { [key: string]: number } = {};
      const thirtyDaysAgo = subDays(new Date(), 29);
      thirtyDaysAgo.setHours(0,0,0,0);

      allSales.forEach(sale => {
        const saleDate = sale.date;
        if (saleDate.getTime() >= thirtyDaysAgo.getTime()) {
          const dayKey = format(saleDate, "yyyy-MM-dd");
          dailySalesAgg[dayKey] = (dailySalesAgg[dayKey] || 0) + sale.totalValue;
        }
      });

      const processedDailySales: DailySalesData[] = Object.entries(dailySalesAgg)
        .map(([key, total]) => ({
            fullDate: key,
            dateDisplay: format(new Date(key + 'T00:00:00Z'), "dd/MM", { locale: ptBR }),
            sales: total,
        }))
        .sort((a,b) => a.fullDate.localeCompare(b.fullDate));
      setDailySales(processedDailySales);

      const productSalesAgg: { [productId: string]: number } = {};
      let overallTotalUnitsSold = 0;
      allSales.forEach(sale => {
        productSalesAgg[sale.productId] = (productSalesAgg[sale.productId] || 0) + sale.quantity;
        overallTotalUnitsSold += sale.quantity;
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
        .filter(p => p.stock < 10)
        .sort((a,b) => a.stock - b.stock)
        .slice(0, 10)
        .map(product => ({
          name: product.name,
          stock: product.stock,
        }));
      setStockLevels(processedStockLevels);

      const totalRevenue = allSales.reduce((sum, sale) => sum + sale.totalValue, 0);
      const uniqueCustomers = new Set(allSales.map(sale => sale.customer.toLowerCase().trim()));
      const lowStockItemsCount = products.filter(p => p.stock > 0 && p.stock < 10).length;

      const productProfitAnalysis: {
        [productId: string]: {
          name: string;
          totalRevenue: number;
          totalCost: number;
          unitsSold: number;
          costCalculableSales: number;
          totalSalesRecords: number;
        }
      } = {};

      allSales.forEach(sale => {
        const product = products.find(p => p.id === sale.productId);
        if (!product) return;

        if (!productProfitAnalysis[sale.productId]) {
          productProfitAnalysis[sale.productId] = {
            name: product.name,
            totalRevenue: 0,
            totalCost: 0,
            unitsSold: 0,
            costCalculableSales: 0,
            totalSalesRecords: 0,
          };
        }

        const analysis = productProfitAnalysis[sale.productId];
        analysis.totalRevenue += sale.totalValue;
        analysis.unitsSold += sale.quantity;
        analysis.totalSalesRecords += 1;

        const currentSaleDateTime = sale.date.getTime();

        const relevantEntries = sortedEntries.filter(
          e => e.productId === sale.productId && e.date.getTime() <= currentSaleDateTime
        );

        if (relevantEntries.length > 0) {
          const latestRelevantEntry = relevantEntries[relevantEntries.length - 1];
          if (typeof latestRelevantEntry.unitPrice === 'number' && latestRelevantEntry.unitPrice > 0) {
            const costForThisSaleItem = latestRelevantEntry.unitPrice * sale.quantity;
            analysis.totalCost += costForThisSaleItem;
            analysis.costCalculableSales += 1;
          }
        }
      });

      let overallTotalProfit = 0;
      let overallTotalCostOfGoodsSold = 0;
      let anyIncompleteCosting = false;

      const processedProductProfitData: SalesProfitData[] = Object.values(productProfitAnalysis).map(analysis => {
        const totalProfit = analysis.totalRevenue - analysis.totalCost;
        const profitMargin = analysis.totalRevenue > 0 ? (totalProfit / analysis.totalRevenue) * 100 : 0;
        overallTotalProfit += totalProfit;
        overallTotalCostOfGoodsSold += analysis.totalCost;

        if (analysis.costCalculableSales < analysis.totalSalesRecords) {
          anyIncompleteCosting = true;
        }

        return {
          productId: products.find(p => p.name === analysis.name)?.id || 'unknown',
          name: analysis.name,
          unitsSold: analysis.unitsSold,
          totalRevenue: analysis.totalRevenue,
          totalCost: analysis.totalCost,
          totalProfit: totalProfit,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
          costingCoverage: `${analysis.costCalculableSales}/${analysis.totalSalesRecords}`,
          costCalculableSales: analysis.costCalculableSales,
          totalSalesRecords: analysis.totalSalesRecords,
        };
      }).sort((a, b) => b.totalProfit - a.totalProfit);

      setSalesProfitData(processedProductProfitData);
      setHasIncompleteCosting(anyIncompleteCosting);

      setSummaryMetrics({
        totalRevenue,
        totalCostOfGoodsSold: overallTotalCostOfGoodsSold,
        totalProfitAllProducts: overallTotalProfit,
        activeCustomers: uniqueCustomers.size,
        lowStockItemsCount,
        totalUnitsSold: overallTotalUnitsSold,
      });

    } catch (error) {
      console.error("Failed to load report data:", error);
      toast({ title: "Erro ao Gerar Relatórios", description: "Não foi possível carregar os dados para os relatórios.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const renderChartOrMessage = (data: any[], chartComponent: React.ReactNode, message: string, minHeight: string = "h-[350px]") => {
    if (isLoading && !isMounted) {
      return <div className={`flex flex-col items-center justify-center ${minHeight}`}><Skeleton className="w-full h-full" /></div>;
    }
    if (!isLoading && isMounted && data.length === 0) {
      return <div className={`text-center text-muted-foreground py-10 flex flex-col items-center justify-center ${minHeight}`}>
                <Info size={32} className="mb-2"/>
                <p>{message}</p>
            </div>;
    }
    if(isLoading && isMounted){
        return <div className={`flex flex-col items-center justify-center ${minHeight}`}><Skeleton className="w-full h-full" /></div>;
    }
    return <div className={minHeight}>{chartComponent}</div>;
  };

  const chartLabelFormatter = (value: number) => isMounted && value > 0 ? String(Math.round(value)) : '';
  const chartCurrencyLabelFormatter = (value: number) => isMounted && value > 0 ? `R$${Math.round(value)}` : '';


  if (isLoading && !isMounted) { 
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando relatórios...</p></div>;
  }


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
            Acompanhe as métricas chave do seu negócio. Os cálculos de custo e lucro dependem do registro correto das entradas de estoque com seus respectivos custos unitários.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total (Geral)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${summaryMetrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ ..."}
                        </div>
                        <p className="text-xs text-muted-foreground">Valor total de todas as vendas (Saídas) registradas.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Custo Total (Estimado)</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${summaryMetrics.totalCostOfGoodsSold.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ ..."}
                        </div>
                        <p className="text-xs text-muted-foreground">Custo estimado dos produtos vendidos, baseado no 'Valor Unitário' das Entradas de estoque.</p>
                    </CardContent>
                </Card>
                 <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Total (Estimado)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${summaryMetrics.totalProfitAllProducts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ ..."}
                        </div>
                        <p className="text-xs text-muted-foreground">Estimativa: Receita Total - Custo Total Estimado.</p>
                    </CardContent>
                </Card>
                 <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendas (Unidades)</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-16" /> : isMounted ? summaryMetrics.totalUnitsSold : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">Número total de unidades de produtos vendidas.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                             {isLoading && !isMounted ? <Skeleton className="h-8 w-12" /> : isMounted ? summaryMetrics.activeCustomers : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">Número de clientes únicos que realizaram compras.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens em Estoque Baixo</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-24" /> : isMounted ? `${summaryMetrics.lowStockItemsCount} Produto(s)` : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">Produtos com menos de 10 unidades em estoque.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />Vendas Mensais (R$)
                    </CardTitle>
                    <CardDescription>Total de vendas nos últimos 6 meses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {renderChartOrMessage(monthlySales,
                        <ChartContainer config={salesChartConfig} className="h-full w-full">
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart accessibilityLayer data={monthlySales}>
                              <CartesianGrid vertical={false} />
                              <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                              />
                              <YAxis tickFormatter={(value) => isMounted ? `R$${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : ""} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Bar dataKey="sales" fill="var(--color-sales)" radius={4}>
                                <LabelList dataKey="sales" position="top" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} formatter={chartCurrencyLabelFormatter} />
                              </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        </ChartContainer>,
                        "Nenhuma venda registrada nos últimos 6 meses para exibir o gráfico."
                    )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <Package size={20} className="text-accent" />Produtos Mais Vendidos (Unidades)
                    </CardTitle>
                    <CardDescription>Top 5 produtos mais vendidos em unidades.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {renderChartOrMessage(topProducts,
                        <ChartContainer config={topProductsChartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart accessibilityLayer data={topProducts} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={120} interval={0} />
                                <XAxis dataKey="sales" type="number" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={4}>
                                  <LabelList dataKey="sales" position="right" offset={5} style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} formatter={chartLabelFormatter} />
                                </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>,
                        "Nenhuma venda registrada para exibir os produtos mais vendidos."
                    )}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <CalendarDays size={20} className="text-purple-500" />Vendas Diárias (R$)
                    </CardTitle>
                    <CardDescription>Total de vendas nos últimos 30 dias.</CardDescription>
                </CardHeader>
                <CardContent>
                {renderChartOrMessage(dailySales,
                    <ChartContainer config={dailySalesChartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart accessibilityLayer data={dailySales}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="dateDisplay"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            />
                            <YAxis tickFormatter={(value) => isMounted ? `R$${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : ""} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={4}>
                                <LabelList dataKey="sales" position="top" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} formatter={chartCurrencyLabelFormatter} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    </ChartContainer>,
                    "Nenhuma venda registrada nos últimos 30 dias para exibir o gráfico."
                )}
                </CardContent>
            </Card>


            <Card className="mt-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <FileText size={20} className="text-indigo-500" />Análise de Lucratividade por Produto
                    </CardTitle>
                     <CardDescription className="text-primary-foreground/80">
                        Detalhes de receita, custo, lucro e margem por produto. O lucro é <strong className="text-primary-foreground">Receita (Vendas) - Custo Estimado (Entradas)</strong>.
                    </CardDescription>
                   <div className="text-sm text-muted-foreground mt-2">
                        <strong className="text-primary-foreground/75 text-xs">Nota Importante sobre Custo Estimado:</strong> O "Custo Estimado" é crucial e é derivado do "Valor Unitário" (seu custo de compra) dos produtos nas 'Entradas' de estoque.
                        Para um cálculo preciso:
                        <ol className="list-decimal list-inside text-xs text-primary-foreground/70 pl-2 mt-1 space-y-0.5">
                            <li>Certifique-se de que cada produto vendido tenha um registro de 'Entrada' correspondente no sistema.</li>
                            <li>O 'Valor Unitário' na 'Entrada' deve ser o custo de aquisição do produto e ser <strong className="text-primary-foreground/90">maior que zero</strong>.</li>
                            <li>A 'Data da Entrada' deve ser <strong className="text-primary-foreground/90">anterior ou igual</strong> à data da 'Saída' (venda) para que o custo seja corretamente associado.</li>
                        </ol>
                        A coluna "Cobertura de Custo" (ex: "1/2") indica para quantas vendas do produto foi possível encontrar e aplicar um custo válido. <strong className="text-primary-foreground/90">Se "Custo Estimado" estiver R$ 0,00 ou a "Cobertura" for "0/X", verifique seus lançamentos de 'Entrada' para o produto (valor unitário e data).</strong>
                    </div>
                </CardHeader>
                <CardContent>
                    {(isLoading && !isMounted) ? (
                        <div className="space-y-2 py-10">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : salesProfitData.length === 0 && isMounted ? (
                         <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                            <Info size={32} className="mb-2"/>
                            <p>Nenhuma venda ou produto para analisar a lucratividade.</p>
                            <p className="text-sm">Registre vendas e entradas de estoque (com custos e datas corretas) para ver esta análise.</p>
                        </div>
                    ) : isMounted ? (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Unid. Vendidas</TableHead>
                                <TableHead className="text-right">Receita (R$)</TableHead>
                                <TableHead className="text-right">Custo Estimado (R$)</TableHead>
                                <TableHead className="text-right">Lucro Estimado (R$)</TableHead>
                                <TableHead className="text-right">Margem (%)</TableHead>
                                <TableHead className="text-center">Cobertura de Custo</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {salesProfitData.map((item) => (
                                <TableRow key={item.productId} className={item.costCalculableSales < item.totalSalesRecords ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">{item.unitsSold}</TableCell>
                                <TableCell className="text-right">{isMounted ? item.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "..."}</TableCell>
                                <TableCell className="text-right">{isMounted ? item.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "..."}</TableCell>
                                <TableCell className="text-right font-semibold">{isMounted ? item.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "..."}</TableCell>
                                <TableCell className={`text-right font-semibold ${item.profitMargin < 0 ? 'text-destructive' : 'text-green-600'}`}>{isMounted ? `${item.profitMargin.toFixed(2)}%` : "..."}</TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground">{item.costingCoverage}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableCaption>
                                Lucratividade estimada = Receita das Vendas - Custo das Entradas (baseado no 'Valor Unitário' nas Entradas, registradas em ou antes da data da venda). <br/>
                                "Cobertura de Custo" (ex: "1/2") indica para quantas vendas foi possível calcular o custo. Se for parcial ou "0/X", os valores de Custo, Lucro e Margem podem não refletir a realidade total. <br/>
                                Garanta que as entradas de estoque sejam registradas com custos (Valor Unitário > 0) e datas corretas antes das vendas para maior precisão.
                                {isMounted && hasIncompleteCosting && <span className="block text-destructive text-xs mt-1">Atenção: Alguns produtos têm cálculo de custo parcial ou ausente. Verifique os registros de 'Entrada' para estes produtos (Valor Unitário e Data).</span>}
                            </TableCaption>
                        </Table>
                        </div>
                    ) : (
                        <div className="space-y-2 py-10">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    )
                    }
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <TrendingDown size={20} className="text-orange-500" />Produtos com Estoque Baixo (Top 10)
                </CardTitle>
                <CardDescription>Produtos com quantidade em estoque menor que 10 unidades (ou zerado), ordenados do menor para o maior estoque.</CardDescription>
                </CardHeader>
                <CardContent>
                {renderChartOrMessage(stockLevels,
                    <ChartContainer config={stockChartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart accessibilityLayer data={stockLevels} layout="vertical">
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={120} interval={0} />
                            <XAxis dataKey="stock" type="number" domain={[0, 'dataMax + 2']}/>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="stock" fill="var(--color-stock)" radius={4}>
                               <LabelList dataKey="stock" position="right" offset={5} style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} formatter={chartLabelFormatter} />
                            </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>,
                    "Nenhum produto com estoque baixo (menos de 10 unidades) ou nenhum produto cadastrado.",
                    "h-[300px]"
                )}
                </CardContent>
            </Card>

        </CardContent>
      </Card>
    </div>
  );
}
    

    

