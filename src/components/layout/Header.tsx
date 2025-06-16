
"use client";

import Link from 'next/link';
import { Banana, LayoutGrid, ArrowRightLeft, Package, BarChart3, Settings, Users, Truck, Banknote } from 'lucide-react';
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

// Define navLinks ONCE at the top level with the correct order, labels, and hrefs
const navLinks = [
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/entrada", label: "Compras", icon: ArrowRightLeft }, // Corrected href
  { href: "/saida", label: "Vendas", icon: ArrowRightLeft },   // Corrected href, icon will be flipped
  { href: "/estoque", label: "Estoque", icon: LayoutGrid },
  { href: "/financeiro", label: "Financeiro", icon: Banknote },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const Header = () => {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const closeMobileNav = () => setMobileNavOpen(false);

  const DesktopNav = () => (
    <nav className="hidden md:flex items-center space-x-1">
      {navLinks.map(link => {
        const Icon = link.icon;
        const iconElement = link.label === "Vendas" ? <Icon size={16} className="-scale-x-100" /> : <Icon size={16} />;
        return (
            <Button key={link.href} variant="default" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/90 btn-animated px-3 py-2 bg-primary">
            <Link href={link.href} className="flex items-center gap-1.5">
                {iconElement}
                <span>{link.label}</span>
            </Link>
            </Button>
        );
      })}
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
          {navLinks.map(link => {
             const Icon = link.icon;
             const iconElement = link.label === "Vendas" ? <Icon size={20} className="-scale-x-100" /> : <Icon size={20} />;
             return (
                <Button key={link.href} variant="ghost" asChild className="justify-start text-md px-3 py-2 text-card-foreground hover:bg-primary/10 hover:text-primary btn-animated" onClick={closeMobileNav}>
                <Link href={link.href} className="flex items-center gap-3">
                    {iconElement}
                    <span>{link.label}</span>
                </Link>
                </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );

  if (!hasMounted) {
    // This block renders a consistent desktop header for SSR and initial client paint
    return (
      <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
        {/* Consistent padding: px-8 py-3 */}
        <div className="container mx-auto px-8 py-3 flex justify-between items-center">
          <Link href="/produtos" className="flex items-center gap-2 text-xl sm:text-2xl font-bold font-headline hover:opacity-80 transition-opacity text-card-foreground">
            <Banana size={32} className="mr-1 text-yellow-300"/> {/* Logo banana icon specific color */}
            <span>Controle de Doces</span>
          </Link>
          {/* SSR Desktop Navigation - must match DesktopNav structure and styling */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => { // Ensure this uses the globally defined navLinks
                const Icon = link.icon;
                // Apply -scale-x-100 for "Vendas" icon in SSR block
                const iconElement = link.label === "Vendas" ? <Icon size={16} className="-scale-x-100" /> : <Icon size={16} />;
                return (
                    <Button key={link.href} variant="default" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/90 btn-animated px-3 py-2 bg-primary">
                    {/* Ensure this Link uses link.href from the global navLinks */}
                    <Link href={link.href} className="flex items-center gap-1.5">
                        {iconElement}
                        <span>{link.label}</span>
                    </Link>
                    </Button>
                );
            })}
            </nav>
             {/* SSR Mobile Menu Trigger */}
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
      <div className="container mx-auto px-8 py-3 flex justify-between items-center">
        <Link href="/produtos" className="flex items-center gap-2 text-xl sm:text-2xl font-bold font-headline hover:opacity-80 transition-opacity text-card-foreground">
          <Banana size={isMobile ? 28 : 32} className="mr-1 text-yellow-300"/>
           <span>Controle de Doces</span>
        </Link>
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </div>
    </header>
  );
};

export default Header;
