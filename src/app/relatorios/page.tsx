
"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { BarChart3, TrendingUp, Package, Users, DollarSign, AlertTriangle, Info, FileText, TrendingDown } from "lucide-react";
import { BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { getStoredSales, getStoredProducts, getStoredEntries } from "@/lib/storage";
import type { Sale, Product, Entry, SalesProfitData } from "@/lib/types";
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
  totalProfitAllProducts: number;
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
  const [salesProfitData, setSalesProfitData] = useState<SalesProfitData[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalRevenue: 0,
    activeCustomers: 0,
    lowStockItemsCount: 0,
    totalProfitAllProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasIncompleteCosting, setHasIncompleteCosting] = useState(false);


  const loadReportData = () => {
    setIsLoading(true);
    const sales = getStoredSales();
    const products = getStoredProducts();
    // Ensure entries are sorted by date for correct LIFO/FIFO-like costing (latest cost before sale)
    const entries = getStoredEntries().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
      .slice(0, 10) 
      .map(product => ({
        name: product.name,
        stock: product.stock,
      }));
    setStockLevels(processedStockLevels);
    
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const uniqueCustomers = new Set(sales.map(sale => sale.customer.toLowerCase().trim()));
    const lowStockItemsCount = products.filter(p => p.stock > 0 && p.stock < 10).length; 

    // Profit Analysis
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

    sales.forEach(sale => {
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

      const relevantEntries = entries.filter(e => e.productId === sale.productId && new Date(e.date) <= new Date(sale.date));
      if (relevantEntries.length > 0) {
        const latestRelevantEntry = relevantEntries[relevantEntries.length - 1];
        const costForThisSaleItem = latestRelevantEntry.unitPrice * sale.quantity;
        analysis.totalCost += costForThisSaleItem;
        analysis.costCalculableSales += 1;
      }
    });
    
    let overallTotalProfit = 0;
    let anyIncompleteCosting = false;

    const processedProductProfitData: SalesProfitData[] = Object.entries(productProfitAnalysis).map(([productId, analysis]) => {
      const totalProfit = analysis.totalRevenue - analysis.totalCost;
      const profitMargin = analysis.totalRevenue > 0 ? (totalProfit / analysis.totalRevenue) * 100 : 0;
      overallTotalProfit += totalProfit;

      if (analysis.costCalculableSales < analysis.totalSalesRecords) {
        anyIncompleteCosting = true;
      }
      
      return {
        productId,
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
      activeCustomers: uniqueCustomers.size,
      lowStockItemsCount,
      totalProfitAllProducts: overallTotalProfit,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    loadReportData();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'controleDocesApp_sales' || event.key === 'controleDocesApp_products' || event.key === 'controleDocesApp_entries' ) { 
            loadReportData();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  const renderChartOrMessage = (data: any[], chartComponent: React.ReactNode, message: string, minHeight: string = "h-[350px]") => {
    if (isLoading) {
      return <p className="text-center text-muted-foreground py-10">Carregando dados...</p>;
    }
    if (data.length === 0) {
      return <div className={`text-center text-muted-foreground py-10 flex flex-col items-center justify-center ${minHeight}`}>
                <Info size={32} className="mb-2"/> 
                <p>{message}</p>
            </div>;
    }
    return <div className={minHeight}>{chartComponent}</div>;
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
            Acompanhe as métricas chave do seu negócio. Os dados são atualizados em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total (Geral)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {summaryMetrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Valor total de todas as vendas.</p>
                    </CardContent>
                </Card>
                 <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Total (Estimado)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {summaryMetrics.totalProfitAllProducts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Lucro total de todos os produtos. <br/>(Baseado nos custos de entrada disponíveis)</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.activeCustomers}</div>
                        <p className="text-xs text-muted-foreground">Número de clientes únicos.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens em Estoque Baixo</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryMetrics.lowStockItemsCount} Produto(s)</div>
                        <p className="text-xs text-muted-foreground">Produtos com menos de 10 unidades.</p>
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
                        <BarChart accessibilityLayer data={monthlySales}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            />
                            <YAxis tickFormatter={(value) => `R$${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
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
                    <CardContent>
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
            </div>

            <Card className="mt-6">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <FileText size={20} className="text-indigo-500" />Análise de Lucratividade por Produto
                </CardTitle>
                <CardDescription>Detalhes de receita, custo, lucro e margem por produto. Ordenado por maior lucro.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <p className="text-center text-muted-foreground py-10">Carregando dados de lucratividade...</p>
                    ) : salesProfitData.length === 0 ? (
                         <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                            <Info size={32} className="mb-2"/> 
                            <p>Nenhuma venda ou produto para analisar a lucratividade.</p>
                            <p className="text-sm">Registre vendas e entradas de estoque para ver esta análise.</p>
                        </div>
                    ) : (
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
                                <TableCell className="text-right">{item.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                <TableCell className="text-right">{item.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                <TableCell className="text-right font-semibold">{item.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                <TableCell className={`text-right font-semibold ${item.profitMargin < 0 ? 'text-destructive' : 'text-green-600'}`}>{item.profitMargin.toFixed(2)}%</TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground">{item.costingCoverage}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableCaption>
                                Lucratividade estimada com base nos custos de entrada registrados em ou antes da data da venda. 
                                {hasIncompleteCosting && <span className="block text-destructive text-xs mt-1">Alguns produtos têm cálculo de custo parcial (indicado na tabela). Isso pode afetar a precisão do lucro e margem. Garanta que as entradas de estoque sejam registradas antes das vendas para maior precisão.</span>}
                            </TableCaption>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card className="mt-6 md:col-span-2">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <TrendingDown size={20} className="text-orange-500" />Produtos com Estoque Baixo (Top 10)
                </CardTitle>
                <CardDescription>Produtos com quantidade em estoque menor que 10 unidades (ou zerado), ordenados do menor para o maior estoque.</CardDescription>
                </CardHeader>
                <CardContent>
                {renderChartOrMessage(stockLevels.filter(p=>p.stock < 10), 
                    <ChartContainer config={stockChartConfig} className="h-full w-full">
                        <BarChart accessibilityLayer data={stockLevels.filter(p=>p.stock < 10).sort((a,b)=>a.stock-b.stock)} layout="vertical">
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={120} interval={0} />
                            <XAxis dataKey="stock" type="number" domain={[0, 'dataMax + 2']}/>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="stock" fill="var(--color-stock)" radius={4} />
                        </BarChart>
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


    