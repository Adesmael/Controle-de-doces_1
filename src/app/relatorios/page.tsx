
"use client"

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { BarChart3, TrendingUp, Package, Users, DollarSign, Info, FileText, Loader2, CalendarDays, Receipt, ShoppingBag, AlertTriangle, Filter, Warehouse, TrendingDown } from "lucide-react";
import { BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { getSales, getProducts, getEntries } from "@/lib/storage";
import type { Sale, Product, Entry, SalesProfitData } from "@/lib/types";
import { format, subMonths, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


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
  sales: number; // Units sold
}

interface StockLevelData {
  name: string;
  stock: number;
}

interface SummaryMetrics {
  totalRevenue: number;
  totalCostOfAcquisitions: number;
  totalProfitAllProducts: number;
  activeCustomers: number;
  lowStockItemsCount: number;
  totalUnitsSold: number;
  numberOfSalesProcessed: number;
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

const ALL_FILTER_VALUE = "_ALL_"; 

export default function RelatoriosPage() {
  const [rawSales, setRawSales] = useState<Sale[]>([]);
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [rawEntries, setRawEntries] = useState<Entry[]>([]);
  
  const [uniqueClients, setUniqueClients] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<{id: string, name: string}[]>([]);

  const [selectedClient, setSelectedClient] = useState<string>(ALL_FILTER_VALUE);
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>(ALL_FILTER_VALUE);

  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    async function initialLoad() {
      setIsLoading(true);
      try {
        const [salesFromDB, productsFromDB, entriesFromDB] = await Promise.all([
          getSales(),
          getProducts(),
          getEntries()
        ]);
        
        setRawSales(salesFromDB.map(s => ({ ...s, date: new Date(s.date) })));
        setRawProducts(productsFromDB);
        setRawEntries(entriesFromDB.map(e => ({ ...e, date: new Date(e.date) })));

        const clients = Array.from(new Set(salesFromDB.map(s => s.customer))).sort();
        setUniqueClients(clients);
        
        const prods = productsFromDB.map(p => ({id: p.id, name: p.name})).sort((a,b) => a.name.localeCompare(b.name));
        setAvailableProducts(prods);

      } catch (error) {
        toast({ title: "Erro ao Carregar Dados Base", description: "Não foi possível buscar os dados para os filtros e relatórios.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    initialLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSales = useMemo(() => {
    let tempSales = [...rawSales];
    if (selectedClient !== ALL_FILTER_VALUE) {
      tempSales = tempSales.filter(s => s.customer === selectedClient);
    }
    if (selectedProductFilter !== ALL_FILTER_VALUE) {
      tempSales = tempSales.filter(s => s.productId === selectedProductFilter);
    }
    return tempSales;
  }, [rawSales, selectedClient, selectedProductFilter]);

  const processedData = useMemo(() => {
    if (isLoading || !isMounted) { 
      return {
        monthlySales: [],
        dailySales: [],
        topProductsChartData: [],
        stockLevels: [],
        salesProfitAnalysisData: [],
        summaryMetrics: { totalRevenue: 0, totalCostOfAcquisitions: 0, totalProfitAllProducts: 0, activeCustomers: 0, lowStockItemsCount: 0, totalUnitsSold: 0, numberOfSalesProcessed: 0 },
        hasZeroCostEntriesInTable: false,
      };
    }

    const allSalesToProcess = filteredSales;
    const productsFromDB = rawProducts;
    
    const monthlySalesAgg: { [key: string]: number } = {};
    const sixMonthsAgo = subMonths(new Date(), 5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0,0,0,0);
    allSalesToProcess.forEach(sale => {
      if (sale.date.getTime() >= sixMonthsAgo.getTime()) {
        const monthYearKey = format(sale.date, "yyyy-MM");
        monthlySalesAgg[monthYearKey] = (monthlySalesAgg[monthYearKey] || 0) + sale.totalValue;
      }
    });
    const processedMonthlySales: MonthlySalesData[] = Object.entries(monthlySalesAgg)
      .map(([key, total]) => ({ yearMonth: key, month: format(new Date(key + '-02T00:00:00Z'), "MMM/yy", { locale: ptBR }), sales: total }))
      .sort((a,b) => a.yearMonth.localeCompare(b.yearMonth));

    const dailySalesAgg: { [key: string]: number } = {};
    const thirtyDaysAgo = subDays(new Date(), 29); thirtyDaysAgo.setHours(0,0,0,0);
    allSalesToProcess.forEach(sale => {
      if (sale.date.getTime() >= thirtyDaysAgo.getTime()) {
        const dayKey = format(sale.date, "yyyy-MM-dd");
        dailySalesAgg[dayKey] = (dailySalesAgg[dayKey] || 0) + sale.totalValue;
      }
    });
    const processedDailySales: DailySalesData[] = Object.entries(dailySalesAgg)
      .map(([key, total]) => ({ fullDate: key, dateDisplay: format(parseISO(key + 'T00:00:00'), "dd/MM", { locale: ptBR }), sales: total }))
      .sort((a,b) => a.fullDate.localeCompare(b.fullDate));

    const productSalesAgg: { [productId: string]: number } = {};
    let overallTotalUnitsSold = 0;
    allSalesToProcess.forEach(sale => {
      productSalesAgg[sale.productId] = (productSalesAgg[sale.productId] || 0) + sale.quantity;
      overallTotalUnitsSold += sale.quantity;
    });
    const processedTopProductsChartData: ProductSalesChartData[] = Object.entries(productSalesAgg)
      .map(([productId, quantity]) => ({ name: productsFromDB.find(p => p.id === productId)?.name || `Produto ID ${productId}`, sales: quantity }))
      .sort((a, b) => b.sales - a.sales).slice(0, 5);

    const processedStockLevels: StockLevelData[] = productsFromDB
      .filter(p => p.stock < 10) 
      .sort((a,b) => a.stock - b.stock).slice(0, 10)
      .map(product => ({ name: product.name, stock: product.stock }));

    const totalRevenueFromFilteredSales = allSalesToProcess.reduce((sum, sale) => sum + sale.totalValue, 0);
    const uniqueCustomers = new Set(allSalesToProcess.map(sale => sale.customer.toLowerCase().trim()));
    const lowStockItemsCount = productsFromDB.filter(p => p.stock > 0 && p.stock < 10).length;
    
    let totalCostOfAcquisitionsForSummaryCard = 0;
    if (selectedClient === ALL_FILTER_VALUE && selectedProductFilter === ALL_FILTER_VALUE) {
        totalCostOfAcquisitionsForSummaryCard = rawEntries.reduce((sum, entry) => sum + entry.totalValue, 0);
    } else {
        const productIdsInFilteredSales = new Set(allSalesToProcess.map(sale => sale.productId));
        if (productIdsInFilteredSales.size > 0) {
            const relevantEntriesForCostCard = rawEntries.filter(entry => productIdsInFilteredSales.has(entry.productId));
            totalCostOfAcquisitionsForSummaryCard = relevantEntriesForCostCard.reduce((sum, entry) => sum + entry.totalValue, 0);
        } else {
            totalCostOfAcquisitionsForSummaryCard = 0;
        }
    }
    
    const profitForSummaryCard = totalRevenueFromFilteredSales - totalCostOfAcquisitionsForSummaryCard;

    const productTotalEntryCosts: Record<string, number> = {};
    let systemHasZeroCostEntriesForTable = false;
    rawEntries.forEach(entry => {
      productTotalEntryCosts[entry.productId] = (productTotalEntryCosts[entry.productId] || 0) + entry.totalValue;
      if (entry.unitPrice === 0 && entry.productId) {
        systemHasZeroCostEntriesForTable = true;
      }
    });
    
    const productAnalysisMap: Map<string, {productId: string, productName: string, unitsSold: number, totalRevenue: number, totalSalesRecords: number}> = new Map();
    productsFromDB.forEach(product => {
      productAnalysisMap.set(product.id, {
        productId: product.id, productName: product.name, unitsSold: 0, totalRevenue: 0, totalSalesRecords: 0,
      });
    });
    
    allSalesToProcess.forEach(sale => {
      const analysis = productAnalysisMap.get(sale.productId);
      if (!analysis) {
          return; 
      }
      analysis.totalRevenue += sale.totalValue;
      analysis.unitsSold += sale.quantity;
      analysis.totalSalesRecords +=1;
    });
    
    const processedProductProfitData: SalesProfitData[] = Array.from(productAnalysisMap.values())
      .filter(analysis => selectedProductFilter !== ALL_FILTER_VALUE ? analysis.productId === selectedProductFilter : analysis.totalSalesRecords > 0) 
      .map(analysis => {
        const productTotalCostFromEntries = productTotalEntryCosts[analysis.productId] || 0;
        const totalProfit = analysis.totalRevenue - productTotalCostFromEntries;
        const profitMargin = analysis.totalRevenue > 0 ? (totalProfit / analysis.totalRevenue) * 100 : 0;
        return { 
            ...analysis, 
            totalCost: productTotalCostFromEntries,
            totalProfit, 
            profitMargin: parseFloat(profitMargin.toFixed(2)) 
        };
      }).sort((a, b) => b.totalProfit - a.totalProfit); 
    

    return {
      monthlySales: processedMonthlySales,
      dailySales: processedDailySales,
      topProductsChartData: processedTopProductsChartData,
      stockLevels: processedStockLevels,
      salesProfitAnalysisData: processedProductProfitData,
      summaryMetrics: {
        totalRevenue: totalRevenueFromFilteredSales,
        totalCostOfAcquisitions: totalCostOfAcquisitionsForSummaryCard,
        totalProfitAllProducts: profitForSummaryCard,
        activeCustomers: uniqueCustomers.size,
        lowStockItemsCount,
        totalUnitsSold: overallTotalUnitsSold,
        numberOfSalesProcessed: allSalesToProcess.length,
      },
      hasZeroCostEntriesInTable: systemHasZeroCostEntriesForTable,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSales, rawProducts, rawEntries, isLoading, isMounted, selectedClient, selectedProductFilter]);


  const chartLabelFormatter = (value: number) => isMounted && value > 0 ? String(Math.round(value)) : '';
  const chartCurrencyLabelFormatter = (value: number) => isMounted && value !== undefined ? `R$${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '';
  const chartSmallCurrencyLabelFormatter = (value: number) => isMounted && value !== undefined ? `R$${Number(value).toFixed(0)}` : '';


  const renderChartOrMessage = (data: any[], chartComponent: React.ReactNode, message: string, minHeight: string = "h-[350px]") => {
    if (isLoading && !isMounted) { return <div className={`flex flex-col items-center justify-center ${minHeight} py-10`}><Skeleton className="w-full h-full" /></div>; }
    if (!isLoading && isMounted && data.length === 0) {
      return <div className={`text-center text-muted-foreground py-10 flex flex-col items-center justify-center ${minHeight}`}><Info size={32} className="mb-2"/><p>{message}</p></div>;
    }
    if (isLoading && isMounted && data.length > 0 && !processedData.summaryMetrics.totalRevenue && selectedClient === ALL_FILTER_VALUE && selectedProductFilter === ALL_FILTER_VALUE && rawSales.length > 0) { 
       return <div className={`text-center text-muted-foreground py-10 flex flex-col items-center justify-center ${minHeight}`}><Info size={32} className="mb-2"/><p>{message}</p></div>;
    }
    if (isLoading && isMounted) { return <div className={`flex flex-col items-center justify-center ${minHeight} py-10`}><Skeleton className="w-full h-full" /></div>; } 
    return <div className={minHeight}>{chartComponent}</div>;
  };

  const handleClearFilters = () => {
    setSelectedClient(ALL_FILTER_VALUE);
    setSelectedProductFilter(ALL_FILTER_VALUE);
  };

  const shouldShowZeroCostEntryAlert = isMounted && !isLoading && processedData.hasZeroCostEntriesInTable;


  if (isLoading && !isMounted) { 
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando relatórios...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <BarChart3 size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">Painel de Relatórios Gerenciais</CardTitle>
          </div>
           <div className="text-primary-foreground/80 mt-1">
            Acompanhe as métricas chave do seu negócio.
           </div>
        </CardHeader>
        <CardContent className="p-6">
            <Card className="mb-6 bg-card/50 shadow">
                <CardHeader>
                    <CardTitle className="text-lg font-headline flex items-center gap-2"><Filter size={20} className="text-primary"/>Filtros</CardTitle>
                    <CardDescription>Refine os dados dos relatórios abaixo.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="client-filter" className="block text-sm font-medium text-foreground mb-1">Filtrar por Cliente:</label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger id="client-filter">
                                <SelectValue placeholder="Selecione um Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>Todos os Clientes</SelectItem>
                                {uniqueClients.map(client => <SelectItem key={client} value={client}>{client}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="product-filter" className="block text-sm font-medium text-foreground mb-1">Filtrar por Produto:</label>
                        <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
                            <SelectTrigger id="product-filter">
                                <SelectValue placeholder="Selecione um Produto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>Todos os Produtos</SelectItem>
                                {availableProducts.map(prod => <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleClearFilters} variant="outline" size="sm" disabled={selectedClient === ALL_FILTER_VALUE && selectedProductFilter === ALL_FILTER_VALUE}>Limpar Filtros</Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Receita Total (Vendas)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${processedData.summaryMetrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Skeleton className="h-8 w-32" />}</div>
                        <p className="text-xs text-muted-foreground">Soma de todas as vendas (Saídas), conforme filtros aplicados.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Custo Total</CardTitle><Warehouse className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">{isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${processedData.summaryMetrics.totalCostOfAcquisitions.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Skeleton className="h-8 w-32" />}</div>
                        <p className="text-xs text-muted-foreground">
                            Soma de todas as Entradas. Se filtros ativos, soma das Entradas dos produtos nas vendas filtradas.
                        </p>
                    </CardContent>
                </Card>
                 <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lucro Total Estimado</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading && !isMounted ? <Skeleton className="h-8 w-32" /> : isMounted ? `R$ ${processedData.summaryMetrics.totalProfitAllProducts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Skeleton className="h-8 w-32" />}</div>
                        <p className="text-xs text-muted-foreground">Receita Total (Vendas) - Custo Total (considerando filtros).</p>
                    </CardContent>
                </Card>
                 <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Vendas (Unidades)</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading && !isMounted ? <Skeleton className="h-8 w-16" /> : isMounted ? processedData.summaryMetrics.totalUnitsSold : <Skeleton className="h-8 w-16" />}</div>
                        <p className="text-xs text-muted-foreground">Unidades vendidas, conforme filtros aplicados.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading && !isMounted ? <Skeleton className="h-8 w-12" /> : isMounted ? processedData.summaryMetrics.activeCustomers : <Skeleton className="h-8 w-12" />}</div>
                        <p className="text-xs text-muted-foreground">Com base nas vendas filtradas.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Itens em Estoque Baixo</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading && !isMounted ? <Skeleton className="h-8 w-24" /> : isMounted ? `${processedData.summaryMetrics.lowStockItemsCount} Produto(s)` : <Skeleton className="h-8 w-24" />}</div>
                        <p className="text-xs text-muted-foreground">Estoque &lt; 10 e &gt; 0 (não afetado por filtros de venda).</p>
                    </CardContent>
                </Card>
            </div>

             {shouldShowZeroCostEntryAlert && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção ao Custo na Tabela de Lucratividade!</AlertTitle>
                    <AlertDescription>
                        O "Custo Total" de alguns produtos na tabela abaixo pode estar subestimado (e o "Lucro Estimado" superestimado).
                        Isso ocorre se houver registros de 'Entrada' para esses produtos com <strong className="font-semibold text-destructive-foreground">"Custo Unitário" igual a zero</strong>.
                        <br/><strong className="block mt-1">Verifique seus lançamentos de 'Entrada':</strong>
                        <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                            <li>Certifique-se de que o "Custo Unitário" em todas as 'Entradas' seja maior que zero para um cálculo preciso do custo do produto na tabela.</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-lg font-headline flex items-center gap-2"><TrendingUp size={20} className="text-primary" />Vendas Mensais (R$)</CardTitle><CardDescription>Total de vendas nos últimos 6 meses {(selectedClient !== ALL_FILTER_VALUE || selectedProductFilter !== ALL_FILTER_VALUE) ? "(filtrado)" : ""}.</CardDescription></CardHeader>
                    <CardContent>
                    {renderChartOrMessage(processedData.monthlySales,
                        <ChartContainer config={salesChartConfig} className="h-full w-full">
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart accessibilityLayer data={processedData.monthlySales} margin={{ top: 25, right: 5, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                              <YAxis tickFormatter={chartCurrencyLabelFormatter} stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false}/>
                              <ChartTooltip cursor={{fill: "hsla(var(--muted), 0.3)"}} content={<ChartTooltipContent labelClassName="font-semibold" />} />
                              <ChartLegend content={<ChartLegendContent className="text-xs"/>} />
                              <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} barSize={40}>
                                <LabelList dataKey="sales" position="top" style={{ fontSize: '11px', fill: 'hsl(var(--foreground))' }} formatter={chartSmallCurrencyLabelFormatter} dy={-4}/>
                              </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        </ChartContainer>,
                        "Nenhuma venda registrada nos últimos 6 meses para exibir o gráfico (verifique filtros).", "h-[350px]"
                    )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-lg font-headline flex items-center gap-2"><Package size={20} className="text-accent" />Produtos Mais Vendidos (Unidades)</CardTitle><CardDescription>Top 5 produtos mais vendidos em unidades {(selectedClient !== ALL_FILTER_VALUE || selectedProductFilter !== ALL_FILTER_VALUE) ? "(filtrado)" : "(geral)"}.</CardDescription></CardHeader>
                    <CardContent>
                    {renderChartOrMessage(processedData.topProductsChartData,
                        <ChartContainer config={topProductsChartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart accessibilityLayer data={processedData.topProductsChartData} layout="vertical" margin={{ top: 5, right: 35, left: 20, bottom: 5 }} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.5)" />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={120} interval={0} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                <XAxis dataKey="sales" type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false}/>
                                <ChartTooltip cursor={{fill: "hsla(var(--muted), 0.3)"}} content={<ChartTooltipContent labelClassName="font-semibold" />} />
                                <ChartLegend content={<ChartLegendContent className="text-xs"/>} />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} barSize={30}>
                                  <LabelList dataKey="sales" position="right" offset={8} style={{ fontSize: '11px', fill: 'hsl(var(--foreground))' }} formatter={chartLabelFormatter} />
                                </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>,
                        "Nenhuma venda registrada para exibir os produtos mais vendidos (verifique filtros).", "h-[350px]"
                    )}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader className="pb-2"><CardTitle className="text-lg font-headline flex items-center gap-2"><CalendarDays size={20} className="text-chart-2" />Vendas Diárias (R$)</CardTitle><CardDescription>Total de vendas nos últimos 30 dias {(selectedClient !== ALL_FILTER_VALUE || selectedProductFilter !== ALL_FILTER_VALUE) ? "(filtrado)" : ""}.</CardDescription></CardHeader>
                <CardContent>
                {renderChartOrMessage(processedData.dailySales,
                    <ChartContainer config={dailySalesChartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart accessibilityLayer data={processedData.dailySales} margin={{ top: 25, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                            <XAxis dataKey="dateDisplay" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                            <YAxis tickFormatter={chartCurrencyLabelFormatter} stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false}/>
                            <ChartTooltip cursor={{fill: "hsla(var(--muted), 0.3)"}} content={<ChartTooltipContent labelClassName="font-semibold" />} />
                            <ChartLegend content={<ChartLegendContent className="text-xs"/>} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} barSize={30}>
                                <LabelList dataKey="sales" position="top" style={{ fontSize: '11px', fill: 'hsl(var(--foreground))' }} formatter={chartSmallCurrencyLabelFormatter} dy={-4}/>
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    </ChartContainer>,
                    "Nenhuma venda registrada nos últimos 30 dias para exibir o gráfico (verifique filtros).", "h-[350px]"
                )}
                </CardContent>
            </Card>

            <Card className="mt-6">
                 <CardHeader className="pb-2">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg font-headline flex items-center gap-2"><FileText size={20} className="text-indigo-500" />Análise de Lucratividade por Produto</CardTitle>
                        <CardDescription className="text-primary-foreground/80">
                            {/* Content removed as per user request */}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {(isLoading && !isMounted) ? (
                        <div className="py-10 space-y-2"><Skeleton className="w-full h-8" /><Skeleton className="w-full h-8" /><Skeleton className="w-full h-8" /></div>
                    ) : processedData.salesProfitAnalysisData.length === 0 && isMounted ? (
                         <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
                            <Info size={32} className="mb-2"/>
                            <p>Nenhuma venda ou produto para analisar a lucratividade (verifique filtros ou dados de entrada).</p>
                            <p className="text-sm">Registre vendas e entradas de estoque (com custos unitários maiores que zero) para ver esta análise.</p>
                        </div>
                    ) : isMounted ? (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Unid. Vendidas</TableHead>
                                <TableHead className="text-right">Receita Total (R$)</TableHead>
                                <TableHead className="text-right">Custo Total (R$)</TableHead>
                                <TableHead className="text-right">Lucro Estimado Total (R$)</TableHead>
                                <TableHead className="text-right">Margem Lucro (%)</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {processedData.salesProfitAnalysisData.map((item) => (
                                <TableRow key={item.productId} className={item.totalCost === 0 && item.totalSalesRecords > 0 ? "bg-orange-500/5 hover:bg-orange-500/10" : ""}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-right">{item.unitsSold}</TableCell>
                                <TableCell className="text-right">{isMounted ? item.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <Skeleton className="h-5 w-20 float-right" />}</TableCell>
                                <TableCell className="text-right">{isMounted ? item.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <Skeleton className="h-5 w-20 float-right" />}</TableCell>
                                <TableCell className="text-right font-semibold">{isMounted ? item.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <Skeleton className="h-5 w-20 float-right" />}</TableCell>
                                <TableCell className={`text-right font-semibold ${item.profitMargin < 0 ? 'text-destructive' : 'text-green-600'}`}>{isMounted ? `${item.profitMargin.toFixed(2)}%` : <Skeleton className="h-5 w-12 float-right" />}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableCaption>
                                "Custo Total (R$)" é a soma de todas as Entradas para o produto. "Lucro Estimado" = Receita - Custo Total de Entradas.
                                {isMounted && processedData.hasZeroCostEntriesInTable && <span className="block mt-1 text-xs text-destructive font-semibold">Atenção: O "Custo Total" de alguns produtos (e seu "Lucro Estimado") pode estar subestimado devido a 'Entradas' com "Custo Unitário" igual a zero.</span>}
                            </TableCaption>
                        </Table>
                        </div>
                    ) : (
                        <div className="py-10 space-y-2"><Skeleton className="w-full h-8" /><Skeleton className="w-full h-8" /><Skeleton className="w-full h-8" /></div>
                    )
                    }
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader className="pb-2"><CardTitle className="text-lg font-headline flex items-center gap-2"><TrendingDown size={20} className="text-orange-500" />Produtos com Estoque Baixo (Top 10)</CardTitle><CardDescription>Produtos com estoque menor que 10 unidades (incluindo zerado). Não afetado por filtros de venda.</CardDescription></CardHeader>
                <CardContent>
                {renderChartOrMessage(processedData.stockLevels,
                    <ChartContainer config={stockChartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart accessibilityLayer data={processedData.stockLevels} layout="vertical" margin={{ top: 5, right: 35, left: 20, bottom: 5 }} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.5)" />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={120} interval={0} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                            <XAxis dataKey="stock" type="number" domain={[0, 'dataMax + 2']} stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false}/>
                            <ChartTooltip cursor={{fill: "hsla(var(--muted), 0.3)"}} content={<ChartTooltipContent labelClassName="font-semibold" />} />
                            <ChartLegend content={<ChartLegendContent className="text-xs"/>} />
                            <Bar dataKey="stock" fill="var(--color-stock)" radius={[0, 4, 4, 0]} barSize={25}>
                               <LabelList dataKey="stock" position="right" offset={8} style={{ fontSize: '11px', fill: 'hsl(var(--foreground))' }} formatter={chartLabelFormatter} />
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
