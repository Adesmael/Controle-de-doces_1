
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListOrdered, Users, Package, CalendarDays, Loader2, Info, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { getSales, getProducts, getEntries } from "@/lib/storage";
import type { Sale, Product, Entry, DetailedSaleItem, CustomerSalesReport, ProductSalesReport, DatePeriodSaleReport } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function RelatoriosDetalhadosPage() {
  const [detailedSales, setDetailedSales] = useState<DetailedSaleItem[]>([]);
  const [customerSales, setCustomerSales] = useState<CustomerSalesReport[]>([]);
  const [productSalesSummary, setProductSalesSummary] = useState<ProductSalesReport[]>([]);
  const [dailySalesSummary, setDailySalesSummary] = useState<DatePeriodSaleReport[]>([]);
  const [monthlySalesSummary, setMonthlySalesSummary] = useState<DatePeriodSaleReport[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [costCalculationWarning, setCostCalculationWarning] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadDetailedReportData = async () => {
    setIsLoading(true);
    setCostCalculationWarning(false);
    // console.log("--- DETALHADOS: Iniciando loadDetailedReportData ---");
    try {
      const [salesFromDB, productsFromDB, entriesFromDB] = await Promise.all([
        getSales(),
        getProducts(),
        getEntries()
      ]);

      const allEntries = entriesFromDB.map(e => ({...e, date: new Date(e.date)}));
      const allSales = salesFromDB.map(s => ({...s, date: new Date(s.date)}));
      // Entries MUST be sorted by date ascending to pick the latest relevant cost
      const sortedEntries = [...allEntries].sort((a, b) => a.date.getTime() - b.date.getTime());
      // console.log("--- DETALHADOS: Entradas Ordenadas (primeiras 5):", sortedEntries.slice(0,5).map(e => ({id: e.id, productId: e.productId, date: e.date.toISOString(), unitPrice: e.unitPrice})));
      // console.log("--- DETALHADOS: Vendas (primeiras 5):", allSales.slice(0,5).map(s => ({id: s.id, productId: s.productId, date: s.date.toISOString(), quantity: s.quantity, totalValue: s.totalValue})));


      let hasAnyCostWarning = false;

      const processedDetailedSales: DetailedSaleItem[] = allSales.map(sale => {
        // console.log(`--- DETALHADOS (ITEM VENDA): Processando Venda ID ${sale.id}, ProdutoID ${sale.productId} ('${sale.productName || 'N/A'}'), Data ${sale.date.toISOString()}, Qtd ${sale.quantity}, Valor Venda ${sale.totalValue}`);
        const netRevenue = sale.totalValue; // totalValue from Sale already considers discount
        let unitCost: number | undefined = undefined;
        let totalCost: number | undefined = undefined;
        let profit: number | undefined = undefined;
        let profitMargin: number | undefined = undefined;
        let costCalculated = false;

        const currentSaleDateTime = sale.date.getTime();
        // Filter relevant entries: same product, entry date on or before sale date, entry unit price > 0
        const relevantEntries = sortedEntries.filter(
          entry => entry.productId === sale.productId &&
                   entry.date.getTime() <= currentSaleDateTime &&
                   entry.unitPrice > 0
        );

        // if (relevantEntries.length > 0) {
        //    console.log(`--- DETALHADOS (ITEM VENDA ID: ${sale.id}): ENTRADAS RELEVANTES para ${sale.productName} (venda em ${sale.date.toISOString()}):`, relevantEntries.map(re => ({id: re.id, date: re.date.toISOString(), unitPrice: re.unitPrice, productId: re.productId })));
        // } else {
        //    console.log(`--- DETALHADOS (ITEM VENDA ID: ${sale.id}): NENHUMA entrada relevante para ${sale.productName} (venda em ${sale.date.toISOString()}). Condições: productId=${sale.productId}, entry.date <= ${sale.date.toISOString()}, entry.unitPrice > 0`);
        // }


        if (relevantEntries.length > 0) {
          // The last entry in relevantEntries is the latest one due to ascending sort of sortedEntries
          const latestRelevantEntry = relevantEntries[relevantEntries.length - 1];
          // console.log(`--- DETALHADOS (ITEM VENDA ID: ${sale.id}): Última entrada relevante SELECIONADA para ${sale.productName}: Custo Unit. ${latestRelevantEntry.unitPrice}, Data Entrada: ${latestRelevantEntry.date.toISOString()}, ID Entrada: ${latestRelevantEntry.id}`);
          unitCost = latestRelevantEntry.unitPrice;
          totalCost = unitCost * sale.quantity;
          profit = netRevenue - totalCost;
          profitMargin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0; // Profit margin on net revenue
          costCalculated = true;
        } else {
            // console.warn(`--- DETALHADOS (ITEM VENDA ID: ${sale.id}): Nenhuma entrada de custo válida (com Custo Unitário > 0 e Data Entrada <= Data da Venda) encontrada para ${sale.productName} (Produto ID: ${sale.productId}). Custo para esta venda será N/D.`);
            hasAnyCostWarning = true;
        }

        return {
          ...sale, // Includes original sale fields like unitPrice (selling price), discount
          netRevenue, // This is totalValue from Sale: (sale.unitPrice * sale.quantity) - sale.discount
          unitCost,   // Cost of one unit from Entry
          totalCost,  // unitCost * sale.quantity
          profit,     // netRevenue - totalCost
          profitMargin, // (profit / netRevenue) * 100
          costCalculated,
        };
      }).sort((a,b) => b.date.getTime() - a.date.getTime()); // Sort by most recent sale first
      setDetailedSales(processedDetailedSales);
      if (hasAnyCostWarning) setCostCalculationWarning(true);
      // console.log("--- DETALHADOS: Vendas Detalhadas Processadas (primeiras 3):", processedDetailedSales.slice(0,3));

      // Aggregate by Customer
      const customerAgg: { [key: string]: { totalRevenue: number, totalCost: number, totalUnitsSold: number } } = {};
      processedDetailedSales.forEach(ds => {
        const key = ds.customer.trim().toLowerCase();
        if (!customerAgg[key]) {
          customerAgg[key] = { totalRevenue: 0, totalCost: 0, totalUnitsSold: 0 };
        }
        customerAgg[key].totalRevenue += ds.netRevenue;
        customerAgg[key].totalCost += ds.totalCost || 0;
        customerAgg[key].totalUnitsSold += ds.quantity;
      });
      const processedCustomerSales: CustomerSalesReport[] = Object.entries(customerAgg).map(([customerName, data]) => ({
        customerName: salesFromDB.find(s => s.customer.trim().toLowerCase() === customerName)?.customer || customerName,
        totalUnitsSold: data.totalUnitsSold,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit: data.totalRevenue - data.totalCost,
      })).sort((a,b) => b.totalProfit - a.totalProfit);
      setCustomerSales(processedCustomerSales);
      // console.log("--- DETALHADOS: Vendas por Cliente (primeiros 3):", processedCustomerSales.slice(0,3));


      // Aggregate by Product
      const productAgg: { [key: string]: { productName: string, totalUnitsSold: number, totalRevenue: number, totalCost: number, saleCountWithProfitMargin: number, totalProfitMarginSum: number } } = {};
      processedDetailedSales.forEach(ds => {
        const product = productsFromDB.find(p => p.id === ds.productId);
        const productName = product?.name || `Produto ID ${ds.productId}`;
        if (!productAgg[ds.productId]) {
          productAgg[ds.productId] = { productName, totalUnitsSold: 0, totalRevenue: 0, totalCost: 0, saleCountWithProfitMargin: 0, totalProfitMarginSum: 0 };
        }
        productAgg[ds.productId].totalUnitsSold += ds.quantity;
        productAgg[ds.productId].totalRevenue += ds.netRevenue;
        productAgg[ds.productId].totalCost += ds.totalCost || 0;
        if (ds.profitMargin !== undefined) {
            productAgg[ds.productId].saleCountWithProfitMargin += 1;
            productAgg[ds.productId].totalProfitMarginSum += ds.profitMargin;
        }
      });
      const processedProductSales: ProductSalesReport[] = Object.entries(productAgg).map(([productId, data]) => ({
        productId,
        productName: data.productName,
        totalUnitsSold: data.totalUnitsSold,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit: data.totalRevenue - data.totalCost,
        avgProfitMargin: data.saleCountWithProfitMargin > 0 ? data.totalProfitMarginSum / data.saleCountWithProfitMargin : undefined,
      })).sort((a,b) => b.totalProfit - a.totalProfit);
      setProductSalesSummary(processedProductSales);
      // console.log("--- DETALHADOS: Vendas por Produto (primeiros 3):", processedProductSales.slice(0,3));

      // Aggregate Daily Sales
      const dailyAgg: { [key: string]: { totalRevenue: number, totalCost: number } } = {};
      processedDetailedSales.forEach(ds => {
        const dayKey = format(ds.date, "yyyy-MM-dd");
        if (!dailyAgg[dayKey]) {
          dailyAgg[dayKey] = { totalRevenue: 0, totalCost: 0 };
        }
        dailyAgg[dayKey].totalRevenue += ds.netRevenue;
        dailyAgg[dayKey].totalCost += ds.totalCost || 0;
      });
      const processedDailySales: DatePeriodSaleReport[] = Object.entries(dailyAgg).map(([dayKey, data]) => ({
        period: format(parseISO(dayKey + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }),
        sortableDate: dayKey,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit: data.totalRevenue - data.totalCost,
      })).sort((a,b) => b.sortableDate.localeCompare(a.sortableDate));
      setDailySalesSummary(processedDailySales);
      // console.log("--- DETALHADOS: Vendas Diárias (primeiros 3):", processedDailySales.slice(0,3));


      // Aggregate Monthly Sales
      const monthlyAgg: { [key: string]: { totalRevenue: number, totalCost: number } } = {};
      processedDetailedSales.forEach(ds => {
        const monthYearKey = format(ds.date, "yyyy-MM");
        if (!monthlyAgg[monthYearKey]) {
          monthlyAgg[monthYearKey] = { totalRevenue: 0, totalCost: 0 };
        }
        monthlyAgg[monthYearKey].totalRevenue += ds.netRevenue;
        monthlyAgg[monthYearKey].totalCost += ds.totalCost || 0;
      });
      const processedMonthlySales: DatePeriodSaleReport[] = Object.entries(monthlyAgg).map(([monthYearKey, data]) => ({
        period: format(parseISO(monthYearKey + '-01T00:00:00'), "MMM/yy", { locale: ptBR }),
        sortableDate: monthYearKey,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit: data.totalRevenue - data.totalCost,
      })).sort((a,b) => b.sortableDate.localeCompare(a.sortableDate));
      setMonthlySalesSummary(processedMonthlySales);
      // console.log("--- DETALHADOS: Vendas Mensais (primeiros 3):", processedMonthlySales.slice(0,3));

    } catch (error) {
      // console.error("--- DETALHADOS: Falha ao carregar dados do relatório detalhado:", error);
      toast({ title: "Erro ao Gerar Relatório Detalhado", description: "Não foi possível carregar os dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      // console.log("--- DETALHADOS: loadDetailedReportData Concluído ---");
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadDetailedReportData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  const renderValue = (value?: number, isCurrency = true, decimalPlaces = 2) => {
    if (value === undefined || value === null || isNaN(value)) return isCurrency ? "R$ N/D" : "N/D";
    return isCurrency
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })
      : value.toFixed(decimalPlaces);
  };

  const renderTable = (title: string, description: string, data: any[], columns: { header: string, accessor: (row: any) => React.ReactNode, className?: string }[], caption: string, icon: React.ElementType) => {
    const IconComponent = icon;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconComponent size={24} className="text-primary" />
            <CardTitle className="text-xl font-headline">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !isMounted ? (
            <div className="space-y-2 py-10"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4" /></div>
          ) : data.length > 0 && isMounted ? (
            <ScrollArea className="h-[400px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(col => <TableHead key={col.header} className={col.className}>{col.header}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index} className={ (row as DetailedSaleItem)?.costCalculated === false ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                      {columns.map(col => <TableCell key={col.header} className={col.className}>{col.accessor(row)}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{caption}</TableCaption>
              </Table>
            </ScrollArea>
          ) : isMounted ? (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                <Info size={32} className="mb-2"/> <p>Nenhum dado disponível para este relatório.</p>
            </div>
          ) : (
             <div className="space-y-2 py-10"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4" /></div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading && !isMounted) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Carregando relatórios detalhados...</p></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Relatórios Detalhados
            </CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80 mt-1">
            Análise granular de vendas, custos e lucratividade. O Lucro é: <strong className="text-primary-foreground">Receita Líquida (Vendas) MENOS Custo Total Estimado (dos Custos Unitários registrados nas Entradas)</strong>. <br/>
            Certifique-se que as <strong className="text-primary-foreground">Entradas de estoque</strong> estão registradas com <strong className="text-primary-foreground">Custos Unitários corretos (&gt;0)</strong> e <strong className="text-primary-foreground">Datas anteriores ou iguais às vendas</strong> para precisão.
            Um valor "N/D" (Não Determinado) para custo/lucro indica que uma entrada de custo válida não foi encontrada para aquela venda.
          </CardDescription>
           {costCalculationWarning && isMounted && (
            <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive-foreground flex items-start gap-2">
                <AlertTriangle size={30} className="text-destructive flex-shrink-0" />
                <div>
                    <strong className="font-semibold">Atenção ao Cálculo de Custo:</strong> Para algumas vendas (marcadas em rosa claro na tabela "Detalhes de Todas as Vendas" ou resultando em N/D), o custo não pôde ser determinado. Isso ocorre se não houver um registro de 'Entrada' para o produto com 'Custo Unitário' maior que zero e 'Data da Entrada' anterior ou igual à data da venda. Verifique seus lançamentos para garantir a precisão dos relatórios de lucratividade. <br/>
                    <strong className="mt-1 block">Dica de Depuração:</strong> Descomente as linhas `// console.log(...)` no arquivo `src/app/relatorios-detalhados/page.tsx` (procure por "DETALHADOS:") e abra o console do navegador (F12) para ver como os dados estão sendo processados para cada venda.
                </div>
            </div>
            )}
        </CardHeader>
      </Card>

      {renderTable("Detalhes de Todas as Vendas", "Lista de todas as transações de venda com detalhamento de custo e lucro por item.", detailedSales, [
        { header: "Data", accessor: (row: DetailedSaleItem) => format(row.date, "dd/MM/yy HH:mm", { locale: ptBR }) },
        { header: "Cliente", accessor: (row: DetailedSaleItem) => row.customer },
        { header: "Produto", accessor: (row: DetailedSaleItem) => row.productName },
        { header: "Qtd.", accessor: (row: DetailedSaleItem) => row.quantity, className: "text-right" },
        { header: "Venda Unit. (R$)", accessor: (row: DetailedSaleItem) => renderValue(row.unitPrice), className: "text-right" }, // Selling price per unit
        { header: "Receita Líq. (R$)", accessor: (row: DetailedSaleItem) => <span className="font-semibold">{renderValue(row.netRevenue)}</span>, className: "text-right" }, // Total value of sale after discount
        { header: "Custo Unit. (R$)", accessor: (row: DetailedSaleItem) => renderValue(row.unitCost), className: "text-right text-xs" }, // Cost per unit from entry
        { header: "Custo Total Venda (R$)", accessor: (row: DetailedSaleItem) => renderValue(row.totalCost), className: "text-right text-xs" }, // Total cost for this sale item
        { header: "Lucro Venda (R$)", accessor: (row: DetailedSaleItem) => <span className={`font-semibold ${row.profit === undefined ? '' : row.profit < 0 ? 'text-destructive' : 'text-green-600'}`}>{renderValue(row.profit)}</span>, className: "text-right" },
        { header: "Margem (%)", accessor: (row: DetailedSaleItem) => <span className={`${row.profitMargin === undefined ? '' : row.profitMargin < 0 ? 'text-destructive' : 'text-green-600'}`}>{renderValue(row.profitMargin, false, 1)}%</span>, className: "text-right text-xs" },
      ], "Vendas ordenadas da mais recente para a mais antiga. 'N/D' indica que o custo não pôde ser determinado para a venda. Linhas em rosa claro indicam vendas sem custo calculado.", ListOrdered)}

      {renderTable("Vendas por Cliente", "Resumo de vendas, custos e lucros agrupados por cliente.", customerSales, [
        { header: "Cliente", accessor: (row: CustomerSalesReport) => row.customerName },
        { header: "Unidades Vendidas", accessor: (row: CustomerSalesReport) => row.totalUnitsSold, className: "text-right" },
        { header: "Receita Total (R$)", accessor: (row: CustomerSalesReport) => renderValue(row.totalRevenue), className: "text-right" },
        { header: "Custo Total (R$)", accessor: (row: CustomerSalesReport) => renderValue(row.totalCost), className: "text-right" },
        { header: "Lucro Total (R$)", accessor: (row: CustomerSalesReport) => <span className={`font-semibold ${row.totalProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>{renderValue(row.totalProfit)}</span>, className: "text-right" },
      ], "Clientes ordenados pelo maior lucro. Lucro = Receita Total - Custo Total.", Users)}

      {renderTable("Vendas por Produto", "Resumo de vendas, custos e lucros agrupados por produto.", productSalesSummary, [
        { header: "Produto", accessor: (row: ProductSalesReport) => row.productName },
        { header: "Unid. Vendidas", accessor: (row: ProductSalesReport) => row.totalUnitsSold, className: "text-right" },
        { header: "Receita Total (R$)", accessor: (row: ProductSalesReport) => renderValue(row.totalRevenue), className: "text-right" },
        { header: "Custo Total (R$)", accessor: (row: ProductSalesReport) => renderValue(row.totalCost), className: "text-right" },
        { header: "Lucro Total (R$)", accessor: (row: ProductSalesReport) => <span className={`font-semibold ${row.totalProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>{renderValue(row.totalProfit)}</span>, className: "text-right" },
        { header: "Margem Média (%)", accessor: (row: ProductSalesReport) => <span className={`${row.avgProfitMargin === undefined ? '' : row.avgProfitMargin < 0 ? 'text-destructive' : 'text-green-600'}`}>{renderValue(row.avgProfitMargin, false, 1)}%</span>, className: "text-right text-xs" },
      ], "Produtos ordenados pelo maior lucro. Lucro = Receita Total - Custo Total.", Package)}

      {renderTable("Vendas Diárias", "Resumo de vendas, custos e lucros agrupados por dia.", dailySalesSummary, [
        { header: "Data", accessor: (row: DatePeriodSaleReport) => row.period },
        { header: "Receita Total (R$)", accessor: (row: DatePeriodSaleReport) => renderValue(row.totalRevenue), className: "text-right" },
        { header: "Custo Total (R$)", accessor: (row: DatePeriodSaleReport) => renderValue(row.totalCost), className: "text-right" },
        { header: "Lucro Total (R$)", accessor: (row: DatePeriodSaleReport) => <span className={`font-semibold ${row.totalProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>{renderValue(row.totalProfit)}</span>, className: "text-right" },
      ], "Vendas diárias ordenadas da mais recente para a mais antiga. Lucro = Receita Total - Custo Total.", CalendarDays)}

      {renderTable("Vendas Mensais", "Resumo de vendas, custos e lucros agrupados por mês.", monthlySalesSummary, [
        { header: "Mês/Ano", accessor: (row: DatePeriodSaleReport) => row.period },
        { header: "Receita Total (R$)", accessor: (row: DatePeriodSaleReport) => renderValue(row.totalRevenue), className: "text-right" },
        { header: "Custo Total (R$)", accessor: (row: DatePeriodSaleReport) => renderValue(row.totalCost), className: "text-right" },
        { header: "Lucro Total (R$)", accessor: (row: DatePeriodSaleReport) => <span className={`font-semibold ${row.totalProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>{renderValue(row.totalProfit)}</span>, className: "text-right" },
      ], "Vendas mensais ordenadas da mais recente para a mais antiga. Lucro = Receita Total - Custo Total.", CalendarDays)}

    </div>
  );
}
