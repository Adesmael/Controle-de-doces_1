
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, Users, DollarSign, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"

// Dados mockados para os gráficos
const salesData = [
  { month: "Jan", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Fev", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Mar", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Abr", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Mai", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Jun", sales: Math.floor(Math.random() * 5000) + 1000 },
];

const salesChartConfig = {
  sales: {
    label: "Vendas (R$)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const topProductsData = [
  { name: "Doce Cremoso", sales: Math.floor(Math.random() * 200) + 50 },
  { name: "Bananada Barra", sales: Math.floor(Math.random() * 150) + 40 },
  { name: "Com Chocolate", sales: Math.floor(Math.random() * 100) + 30 },
  { name: "Diet", sales: Math.floor(Math.random() * 80) + 20 },
  { name: "Geleia", sales: Math.floor(Math.random() * 50) + 10 },
];

const topProductsChartConfig = {
  sales: {
    label: "Unidades Vendidas",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

const stockLevelsData = [
  { name: "Doce Cremoso", stock: Math.floor(Math.random() * 50) },
  { name: "Bananada Barra", stock: Math.floor(Math.random() * 30) },
  { name: "Com Chocolate", stock: Math.floor(Math.random() * 10) }, // Potencial estoque baixo
  { name: "Diet", stock: Math.floor(Math.random() * 5) }, // Potencial estoque baixo
  { name: "Geleia", stock: Math.floor(Math.random() * 20) },
];

const stockChartConfig = {
  stock: {
    label: "Estoque",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig


export default function RelatoriosPage() {
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
            Acompanhe as métricas chave do seu negócio. (Dados de exemplo)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />Vendas Mensais (R$)
              </CardTitle>
              <CardDescription>Total de vendas ao longo dos meses.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={salesData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Package size={20} className="text-accent" />Produtos Mais Vendidos
              </CardTitle>
              <CardDescription>Ranking de produtos por unidades vendidas.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={topProductsChartConfig} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={topProductsData} layout="vertical">
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={100} />
                        <XAxis dataKey="sales" type="number" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" />Níveis de Estoque
              </CardTitle>
              <CardDescription>Visão geral do estoque dos produtos principais.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={stockChartConfig} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={stockLevelsData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="stock" fill="var(--color-stock)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
          </Card>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Vendas (Período)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">R$ 12,345.67</div>
                    <p className="text-xs text-muted-foreground">+20.1% em relação ao mês passado</p>
                </CardContent>
            </Card>
            <Card className="bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+230</div>
                    <p className="text-xs text-muted-foreground">+50 novos este mês</p>
                </CardContent>
            </Card>
             <Card className="bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Itens em Estoque Baixo</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">3 Produtos</div>
                    <p className="text-xs text-muted-foreground">Requerem atenção</p>
                </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
