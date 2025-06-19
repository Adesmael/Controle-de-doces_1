
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, Package, Truck, Users, ArrowRightLeft, LayoutGrid, BarChart3, Settings, Banknote } from 'lucide-react';
import type { Icon as LucideIcon } from 'lucide-react';

// These items correspond to the main sections of the application.
// The "Início" item is intentionally omitted here as this IS the "Início" page.
const dashboardItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  iconClassName?: string;
}> = [
  { href: "/produtos", label: "Produtos", icon: Package, description: "Gerencie seu catálogo de doces e defina detalhes." },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck, description: "Cadastre e administre seus fornecedores de insumos." },
  { href: "/clientes", label: "Clientes", icon: Users, description: "Mantenha um registro dos seus clientes." },
  { href: "/entrada", label: "Compras", icon: ArrowRightLeft, description: "Registre as compras de produtos e seus custos." },
  { href: "/saida", label: "Vendas", icon: ArrowRightLeft, description: "Registre as vendas de produtos para clientes.", iconClassName: "-scale-x-100" },
  { href: "/estoque", label: "Estoque", icon: LayoutGrid, description: "Visualize os níveis atuais de estoque dos produtos." },
  { href: "/financeiro", label: "Financeiro", icon: Banknote, description: "Controle suas entradas, saídas e despesas financeiras." },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, description: "Analise o desempenho e as métricas do seu negócio." },
  { href: "/configuracoes", label: "Configurações", icon: Settings, description: "Exporte/importe dados e outras configurações do sistema." },
];

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary font-headline">
          Bem-vindo ao Controle de Doces
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Seu painel central para gerenciar todos os aspectos do seu negócio de doces.
          Navegue pelas seções abaixo para começar.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {dashboardItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className="block group rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <Card className="h-full flex flex-col bg-card/70 hover:bg-card hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 border-2 border-transparent hover:border-primary/50">
                <CardHeader className="pb-3 pt-5">
                  <div className="mb-4">
                    <span className="inline-block p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className={`h-8 w-8 text-primary group-hover:scale-110 transition-transform ${item.iconClassName || ''}`} />
                    </span>
                  </div>
                  <CardTitle className="text-xl font-semibold text-primary-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pt-0">
                  <CardDescription className="text-sm text-muted-foreground group-hover:text-primary-foreground/90 transition-colors">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
