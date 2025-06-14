
"use client"

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { BarChart3, TrendingUp, Package, Users, DollarSign, Info, FileText, TrendingDown, Loader2, CalendarDays, Receipt, ShoppingBag } from "lucide-react";
import { BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { getSales, getProducts, getEntries } from "@/lib/storage";
import type { Sale, Product, Entry, SalesProfitData, ProductAnalysisData } from "@/lib/types";
import { format, subMonths, subDays, parseISO } from 'date-fns';
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

interface ProductSalesChartData {
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
  const [topProductsChartData, setTopProductsChartData] = useState<ProductSalesChartData[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelData[]>([]);
  const [salesProfitAnalysisData, setSalesProfitAnalysisData] = useState<SalesProfitData[]>([]);
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
    // console.log("--- RELATORIOS: Iniciando loadReportData ---");
    try {
      const [salesFromDB, productsFromDB, entriesFromDB] = await Promise.all([
        getSales(),
        getProducts(),
        getEntries()
      ]);

      // console.log("--- RELATORIOS: Dados brutos - Vendas:", salesFromDB.length, "Produtos:", productsFromDB.length, "Entradas:", entriesFromDB.length);

      const allEntries = entriesFromDB.map(e => ({...e, date: new Date(e.date)}));
      const allSales = salesFromDB.map(s => ({...s, date: new Date(s.date)}));
      
      // console.log("--- RELATORIOS: Primeiras 5 vendas processadas com new Date():", allSales.slice(0,5).map(s => ({id:s.id, date: s.date, customer: s.customer, productId: s.productId, quantity: s.quantity, totalValue: s.totalValue})));
      // console.log("--- RELATORIOS: Primeiras 5 entradas processadas com new Date():", allEntries.slice(0,5).map(e => ({id:e.id, date: e.date, supplier: e.supplier, productId: e.productId, unitPrice: e.unitPrice })));

      const sortedEntries = [...allEntries].sort((a, b) => a.date.getTime() - b.date.getTime());
      // if (sortedEntries.length > 0) console.log("--- RELATORIOS: Primeira entrada ordenada:", sortedEntries[0], "Última:", sortedEntries[sortedEntries.length-1]);


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
      // console.log("--- RELATORIOS: Vendas Mensais Agregadas:", processedMonthlySales);

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
            dateDisplay: format(parseISO(key + 'T00:00:00'), "dd/MM", { locale: ptBR }), 
            sales: total,
        }))
        .sort((a,b) => a.fullDate.localeCompare(b.fullDate)); 
      setDailySales(processedDailySales);
      // console.log("--- RELATORIOS: Vendas Diárias Agregadas:", processedDailySales);


      const productSalesAgg: { [productId: string]: number } = {};
      let overallTotalUnitsSold = 0;
      allSales.forEach(sale => {
        productSalesAgg[sale.productId] = (productSalesAgg[sale.productId] || 0) + sale.quantity;
        overallTotalUnitsSold += sale.quantity;
      });

      const processedTopProductsChartData: ProductSalesChartData[] = Object.entries(productSalesAgg)
        .map(([productId, quantity]) => {
          const product = productsFromDB.find(p => p.id === productId);
          return {
            name: product?.name || `Produto ID ${productId}`, 
            sales: quantity,
          };
        })
        .sort((a, b) => b.sales - a.sales) 
        .slice(0, 5); 
      setTopProductsChartData(processedTopProductsChartData);
      // console.log("--- RELATORIOS: Top Produtos (Gráfico):", processedTopProductsChartData);

      const processedStockLevels: StockLevelData[] = productsFromDB
        .filter(p => p.stock < 10) 
        .sort((a,b) => a.stock - b.stock) 
        .slice(0, 10) 
        .map(product => ({
          name: product.name,
          stock: product.stock,
        }));
      setStockLevels(processedStockLevels);
      // console.log("--- RELATORIOS: Níveis de Estoque Baixo:", processedStockLevels);

      const totalRevenue = allSales.reduce((sum, sale) => sum + sale.totalValue, 0);
      const uniqueCustomers = new Set(allSales.map(sale => sale.customer.toLowerCase().trim()));
      const lowStockItemsCount = productsFromDB.filter(p => p.stock > 0 && p.stock < 10).length;

      // console.log("--- RELATORIOS: Iniciando Análise de Lucratividade por Produto ---");
      const productAnalysisMap: Map<string, ProductAnalysisData> = new Map();

      productsFromDB.forEach(product => {
        productAnalysisMap.set(product.id, {
          productId: product.id,
          productName: product.name,
          unitsSold: 0,
          totalRevenue: 0,
          totalCost: 0,
          costCalculableSalesCount: 0, 
          totalSalesRecords: 0,   
        });
      });

      allSales.forEach(sale => {
        // Descomente as linhas abaixo para depurar o cálculo de custo para cada venda
        // console.log(`--- RELATORIOS: [VENDA ID: ${sale.id}] Processando Venda para ProdutoID ${sale.productId} ('${sale.productName}'), Cliente ${sale.customer}, Data ${sale.date.toISOString()}, Qtd ${sale.quantity}, Valor Total Venda ${sale.totalValue}`);
        
        const analysis = productAnalysisMap.get(sale.productId);
        if (!analysis) {
            // console.warn(`--- RELATORIOS: [VENDA ID: ${sale.id}] Produto com ID ${sale.productId} da venda não encontrado no mapa de análise. Pulando esta venda para análise de custo.`);
            return; 
        }

        analysis.totalRevenue += sale.totalValue;
        analysis.unitsSold += sale.quantity;
        analysis.totalSalesRecords += 1;

        const currentSaleDateTime = sale.date.getTime();
        // console.log(`--- RELATORIOS: [VENDA ID: ${sale.id}] Data da venda (timestamp): ${currentSaleDateTime} para ${analysis.productName}`);

        const relevantEntries = sortedEntries.filter(
          entry => entry.productId === sale.productId && entry.date.getTime() <= currentSaleDateTime && entry.unitPrice > 0
        );
        
        // if (relevantEntries.length > 0) {
        //    console.log(`--- RELATORIOS: [VENDA ID: ${sale.id}] ENTRADAS RELEVANTES para ${analysis.productName} (venda em ${sale.date.toISOString()}):`, relevantEntries.map(re => ({date: re.date.toISOString(), unitPrice: re.unitPrice, id: re.id })));
        // } else {
        //    console.log(`--- RELATORIOS: [VENDA ID: ${sale.id}] NENHUMA entrada relevante encontrada para ${analysis.productName} (venda em ${sale.date.toISOString()}) com custo unitário > 0 e data <= data da venda.`);
        // }


        if (relevantEntries.length > 0) {
          const latestRelevantEntry = relevantEntries[relevantEntries.length - 1]; 
          // console.log(`--- RELATORIOS: [VENDA ID: ${sale.id}] Última entrada relevante SELECIONADA para ${analysis.productName}:`, {date: latestRelevantEntry.date.toISOString(), unitPrice: latestRelevantEntry.unitPrice, id: latestRelevantEntry.id });
          
          if (latestRelevantEntry && latestRelevantEntry.unitPrice > 0) { // Redundant check as it's in filter, but good for safety
             const costForThisSaleItem = latestRelevantEntry.unitPrice * sale.quantity;
             analysis.totalCost += costForThisSaleItem;
             analysis.costCalculableSalesCount += 1; 
            //  console.log(`--- RELATORIOS: [VENDA ID: ${sale.id}] Custo calculado para esta venda de ${analysis.productName}: ${costForThisSaleItem} (Entrada Custo Unit. ${latestRelevantEntry.unitPrice} * Qtd Vendida ${sale.quantity})`);
          } else {
            // console.warn(`--- RELATORIOS: [VENDA ID: ${sale.id}] Última entrada relevante para ${analysis.productName} tem custo unitário ZERO ou é inválida (não deveria acontecer devido ao filtro). Não será usada para custo.`);
          }
        } else {
        //   console.warn(`--- RELATORIOS: [VENDA ID: ${sale.id}] Nenhuma entrada de custo válida (data anterior/igual à venda, custo > 0) encontrada para ${analysis.productName} para a venda ${sale.id}. Custo para esta venda será 0.`);
        }
      });
      // console.log("--- RELATORIOS: Fim Análise de Lucratividade (por produto) ---", productAnalysisMap);


      let overallTotalProfit = 0;
      let overallTotalCostOfGoodsSold = 0;
      let anyIncompleteCosting = false;

      const processedProductProfitData: SalesProfitData[] = Array.from(productAnalysisMap.values())
        .filter(analysis => analysis.totalSalesRecords > 0) 
        .map(analysis => {
            const totalProfit = analysis.totalRevenue - analysis.totalCost;
            const profitMargin = analysis.totalRevenue > 0 ? (totalProfit / analysis.totalRevenue) * 100 : 0;
            
            overallTotalProfit += totalProfit;
            overallTotalCostOfGoodsSold += analysis.totalCost;

            if (analysis.costCalculableSalesCount < analysis.totalSalesRecords) {
              anyIncompleteCosting = true; 
            }

            return {
            ...analysis,
            totalProfit: totalProfit,
            profitMargin: parseFloat(profitMargin.toFixed(2)), 
            costingCoverage: `${analysis.costCalculableSalesCount}/${analysis.totalSalesRecords}`,
            };
      }).sort((a, b) => b.totalProfit - a.totalProfit); 

      setSalesProfitAnalysisData(processedProductProfitData);
      setHasIncompleteCosting(anyIncompleteCosting);
      // console.log("--- RELATORIOS: Dados de Lucratividade Processados (para tabela):", processedProductProfitData);

      setSummaryMetrics({
        totalRevenue,
        totalCostOfGoodsSold: overallTotalCostOfGoodsSold,
        totalProfitAllProducts: overallTotalProfit,
        activeCustomers: uniqueCustomers.size,
        lowStockItemsCount,
        totalUnitsSold: overallTotalUnitsSold,
      });
      // console.log("--- RELATORIOS: Métricas de Resumo Finais:", {totalRevenue, overallTotalCostOfGoodsSold, overallTotalProfit, uniqueCustomersSize: uniqueCustomers.size, lowStockItemsCount, overallTotalUnitsSold});

    } catch (error) {
      console.error("--- RELATORIOS: Falha ao carregar dados do relatório:", error);
      toast({ title: "Erro ao Gerar Relatórios", description: "Não foi possível carregar os dados para os relatórios.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      // console.log("--- RELATORIOS: loadReportData Concluído ---");
    }
  };

  useEffect(() => {
    if (isMounted) { 
        loadReportData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]); 


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
           <div className="text-primary-foreground/80 mt-1">
            Acompanhe as métricas chave do seu negócio.
            O <strong className="text-primary-foreground">Lucro Total Estimado</strong> é calculado como: <strong className="text-primary-foreground">Receita Total (Vendas) - Custo Total Estimado (derivado dos Custos Unitários registrados nas Entradas de estoque)</strong>.
          </div>
        </CardHeader>
        <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total (Vendas)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${summaryMetrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Skeleton className="h-8 w-32" />}
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
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${summaryMetrics.totalCostOfGoodsSold.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Skeleton className="h-8 w-32" />}
                        </div>
                        <p className="text-xs text-muted-foreground">Custo dos produtos vendidos, baseado no 'Custo Unitário' das Entradas.</p>
                    </CardContent>
                </Card>
                 <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Total (Estimado)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${summaryMetrics.totalProfitAllProducts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Skeleton className="h-8 w-32" />}
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
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-16" /> : isMounted ? summaryMetrics.totalUnitsSold : <Skeleton className="h-8 w-16" />}
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
                             {isLoading && !isMounted ? <Skeleton className="h-8 w-12" /> : isMounted ? summaryMetrics.activeCustomers : <Skeleton className="h-8 w-12" />}
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
                            {isLoading && !isMounted ? <Skeleton className="h-8 w-24" /> : isMounted ? `${summaryMetrics.lowStockItemsCount} Produto(s)` : <Skeleton className="h-8 w-24" />}
                        </div>
                        <p className="text-xs text-muted-foreground">Produtos com menos de 10 unidades em estoque (e que possuem estoque > 0).</p>
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
                    <CardDescription>Top 5 produtos mais vendidos em unidades (geral).</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {renderChartOrMessage(topProductsChartData,
                        <ChartContainer config={topProductsChartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart accessibilityLayer data={topProductsChartData} layout="vertical">
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
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                            <FileText size={20} className="text-indigo-500" />Análise de Lucratividade por Produto
                        </CardTitle>
                        <div className="text-primary-foreground/80">
                            Detalhes de receita, custo, lucro e margem por produto. Lucro = <strong className="text-primary-foreground">Receita (Vendas) - Custo Estimado (dos Custos Unitários das Entradas)</strong>.
                        </div>
                    </div>
                   <div className="mt-4 text-sm text-destructive-foreground/90 border-2 border-dashed border-destructive/50 p-4 rounded-md bg-destructive/5">
                        <strong className="block mb-2 text-md text-destructive font-semibold flex items-center"><Info size={18} className="mr-2"/>PARA CÁLCULO CORRETO DO CUSTO E LUCRO - LEIA ATENTAMENTE:</strong> 
                        <p className="mb-1 text-xs">O "Custo Estimado" é fundamental e <strong className="text-destructive">DEPENDE DIRETAMENTE DOS DADOS QUE VOCÊ INSERE</strong> na tela de <strong className="text-destructive">'Entradas'</strong> de estoque.</p>
                        <p className="mb-2 text-xs">Se o "Custo Estimado" estiver <strong className="text-destructive">R$ 0,00</strong> ou a "Cobertura de Custo" (na tabela abaixo) for <strong className="text-destructive">"0/X"</strong> (onde X é o total de vendas do produto), significa que uma ou mais das três condições abaixo <strong className="text-destructive">NÃO foram atendidas</strong> para aquelas vendas. Verifique seus lançamentos de 'Entrada'.</p>
                        <ol className="list-decimal list-inside text-xs space-y-1.5 pl-2">
                            <li><strong className="text-destructive">(PRODUTO CORRETO) REGISTRE ENTRADAS PARA CADA PRODUTO VENDIDO:</strong> Para que o custo de um produto vendido seja calculado, deve existir um registro de 'Entrada' para <strong className="underline">ESSE MESMO PRODUTO</strong> no sistema.</li>
                            <li><strong className="text-destructive">(CUSTO UNITÁRIO > 0) CUSTO UNITÁRIO NA ENTRADA DEVE SER > 0:</strong> Na tela de 'Entrada', o campo 'Custo Unitário' <strong className="underline">DEVE SER O PREÇO QUE VOCÊ PAGOU PELO PRODUTO</strong>. Este valor <strong className="underline">NÃO PODE SER ZERO</strong>. Se for zero, essa entrada não será usada para calcular o custo.</li>
                            <li><strong className="text-destructive">(DATA CORRETA) DATA DA ENTRADA CORRETA (ANTERIOR OU IGUAL À VENDA):</strong> A 'Data da Entrada' do custo deve ser <strong className="underline">ANTERIOR ou IGUAL</strong> à 'Data da Saída' (venda) do produto. O sistema usa a entrada de custo mais recente que atenda essa condição. Se todas as entradas de custo forem posteriores à venda, o custo não será calculado para essa venda.</li>
                        </ol>
                        <p className="mt-3 text-xs"><strong className="text-destructive">Dica de Depuração (se o problema persistir):</strong> Descomente as linhas `console.log(...)` neste arquivo (`src/app/relatorios/page.tsx` - procure por "RELATORIOS:" e "[VENDA ID:]"). Abra o console do navegador (F12) ao carregar esta página para ver como os dados estão sendo processados para cada venda e qual entrada de custo está (ou não) sendo encontrada.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {(isLoading && !isMounted) ? ( 
                        <div className="py-10 space-y-2">
                            <Skeleton className="w-full h-8" />
                            <Skeleton className="w-full h-8" />
                            <Skeleton className="w-full h-8" />
                        </div>
                    ) : salesProfitAnalysisData.length === 0 && isMounted ? ( 
                         <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
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
                                <TableHead className="text-right">Receita Total (R$)</TableHead>
                                <TableHead className="text-right">Custo Estimado Total (R$)</TableHead>
                                <TableHead className="text-right">Lucro Estimado Total (R$)</TableHead>
                                <TableHead className="text-right">Margem Lucro (%)</TableHead>
                                <TableHead className="text-center">Cobertura de Custo (Vendas com Custo / Total de Vendas)</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {salesProfitAnalysisData.map((item) => (
                                <TableRow key={item.productId} className={item.costCalculableSalesCount < item.totalSalesRecords ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-right">{item.unitsSold}</TableCell>
                                <TableCell className="text-right">{isMounted ? item.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <Skeleton className="h-5 w-20 float-right" />}</TableCell>
                                <TableCell className="text-right">{isMounted ? item.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <Skeleton className="h-5 w-20 float-right" />}</TableCell>
                                <TableCell className="text-right font-semibold">{isMounted ? item.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <Skeleton className="h-5 w-20 float-right" />}</TableCell>
                                <TableCell className={`text-right font-semibold ${item.profitMargin < 0 ? 'text-destructive' : 'text-green-600'}`}>{isMounted ? `${item.profitMargin.toFixed(2)}%` : <Skeleton className="h-5 w-12 float-right" />}</TableCell>
                                <TableCell className={`text-center text-xs ${item.costCalculableSalesCount < item.totalSalesRecords ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>{item.costingCoverage}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableCaption>
                                Lucratividade estimada = Receita das Vendas - Custo das Entradas.
                                A "Cobertura de Custo" (ex: "1/2") indica para quantas vendas foi possível calcular o custo.
                                Se for parcial ou "0/X", os valores de Custo, Lucro e Margem podem não refletir a realidade total.
                                Garanta que as entradas de estoque sejam registradas com <strong className="text-primary-foreground/80">Custos (Valor Unitário &gt; 0)</strong> e <strong className="text-primary-foreground/80">Datas corretas (anteriores ou iguais às vendas)</strong> para maior precisão.
                                {isMounted && hasIncompleteCosting && <span className="block mt-1 text-xs text-destructive">Atenção: Alguns produtos têm cálculo de custo parcial ou ausente. Verifique os registros de 'Entrada' para estes produtos (Custo Unitário e Data).</span>}
                            </TableCaption>
                        </Table>
                        </div>
                    ) : ( 
                        <div className="py-10 space-y-2">
                            <Skeleton className="w-full h-8" />
                            <Skeleton className="w-full h-8" />
                            <Skeleton className="w-full h-8" />
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

    