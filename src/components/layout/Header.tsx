
"use client";

import Link from 'next/link';
import { Banana, LayoutGrid, ArrowRightLeft, Package, BarChart3, Settings, Users, Truck, Banknote, Home } from 'lucide-react';
import type { Icon as LucideIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  iconClassName?: string;
}

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Início", icon: Home, description: "Visão geral e acesso rápido às funcionalidades." },
  { href: "/produtos", label: "Produtos", icon: Package, description: "Gerencie seu catálogo de doces." },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck, description: "Cadastre e administre seus fornecedores." },
  { href: "/clientes", label: "Clientes", icon: Users, description: "Gerencie sua base de clientes." },
  { href: "/entrada", label: "Compras", icon: ArrowRightLeft, description: "Registre entradas de produtos e custos." },
  { href: "/saida", label: "Vendas", icon: ArrowRightLeft, description: "Registre vendas de produtos e gere saídas.", iconClassName: "-scale-x-100" },
  { href: "/estoque", label: "Estoque", icon: LayoutGrid, description: "Visualize os níveis de estoque atuais." },
  { href: "/financeiro", label: "Financeiro", icon: Banknote, description: "Controle suas movimentações financeiras." },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, description: "Analise o desempenho do seu negócio." },
  { href: "/configuracoes", label: "Configurações", icon: Settings, description: "Exporte/importe dados e configure o sistema." },
];

const Header = () => {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const closeMobileNav = () => setMobileNavOpen(false);

  const renderIcon = (link: NavLinkItem, size: number) => {
    const Icon = link.icon;
    return <Icon size={size} className={link.iconClassName || ""} />;
  };

  const DesktopNav = () => (
    <nav className="hidden md:flex items-center space-x-1">
      {navLinks.map(link => (
        <Button key={link.href} variant="default" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/90 btn-animated px-3 py-2 bg-primary">
          <Link href={link.href} className="flex items-center gap-1.5">
            {renderIcon(link, 16)}
            <span>{link.label}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );

  const MobileNav = () => (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-card-foreground hover:bg-card/80">
          <LayoutGrid size={24} />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-card p-0">
        <SheetHeader className="p-4 border-b border-primary/20">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Banana size={28} />
            <span>Controle de Doces</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4 space-y-2">
          {navLinks.map(link => (
            <Button key={link.href} variant="ghost" asChild className="justify-start text-md px-3 py-2 text-card-foreground hover:bg-primary/10 hover:text-primary btn-animated" onClick={closeMobileNav}>
              <Link href={link.href} className="flex items-center gap-3">
                {renderIcon(link, 20)}
                <span>{link.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );

  // Fallback for SSR and initial client render before `hasMounted` is true.
  // This ensures the server-rendered HTML is consistent and avoids hydration errors
  // related to `isMobile` which is only known on the client.
  if (!hasMounted) {
    return (
      <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center"> {/* Changed px-8 to px-4 */}
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold font-headline hover:opacity-80 transition-opacity text-card-foreground">
            <Banana size={32} className="mr-1 text-yellow-300"/> {/* Default to larger size for SSR */}
            <span>Controle de Doces</span>
          </Link>
          {/* Render DesktopNav structure for SSR to avoid layout shifts if possible, or a placeholder */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Button key={link.href} variant="default" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/90 btn-animated px-3 py-2 bg-primary">
                <Link href={link.href} className="flex items-center gap-1.5">
                  {renderIcon(link, 16)}
                  <span>{link.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
          {/* Placeholder for mobile trigger to keep structure similar */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="text-card-foreground hover:bg-card/80">
              <LayoutGrid size={24} />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center"> {/* Changed px-8 to px-4 */}
        <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold font-headline hover:opacity-80 transition-opacity text-card-foreground">
          <Banana size={isMobile ? 28 : 32} className="mr-1 text-yellow-300"/>
          <span>Controle de Doces</span>
        </Link>
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </div>
    </header>
  );
};

export default Header;

