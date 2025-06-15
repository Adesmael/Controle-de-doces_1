
"use client";

import Link from 'next/link';
import { Banana, LayoutGrid, ArrowRightLeft, Package, BarChart3, Settings, Users, Truck } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';


const navLinks = [
  { href: "/entrada", label: "Entrada", icon: ArrowRightLeft },
  { href: "/saida", label: "Saída", icon: ArrowRightLeft }, 
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/estoque", label: "Estoque", icon: LayoutGrid },
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
    <nav className="flex items-center space-x-1 bg-primary">
      {navLinks.map(link => {
        const Icon = link.icon;
        const iconElement = link.label === "Saída" ? <Icon size={16} className="-scale-x-100" /> : <Icon size={16} />;
        return (
            <Button key={link.href} variant="ghost" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/80 btn-animated px-3 py-2">
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
        <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary/80">
          <LayoutGrid size={24} />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-background p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Banana size={28} />
            <span>Controle de Doces</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4 space-y-2">
          {navLinks.map(link => {
             const Icon = link.icon;
             const iconElement = link.label === "Saída" ? <Icon size={20} className="-scale-x-100" /> : <Icon size={20} />;
             return (
                <Button key={link.href} variant="ghost" asChild className="justify-start text-md px-3 py-2" onClick={closeMobileNav}>
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

  // Render a consistent structure on the server and for the initial client render
  // to avoid hydration errors.
  // You can adjust py-6 (vertical padding for height) and px-8 (horizontal padding for content width) 
  // on the div below to change header dimensions.
  // Icon sizes (e.g., Banana size={32}) also contribute to height.
  if (!hasMounted) {
    return (
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-8 py-6 flex justify-between items-center"> {/* Example: Large padding */}
          <Link href="/produtos" className="flex items-center gap-2 text-xl sm:text-2xl font-bold font-headline hover:opacity-80 transition-opacity">
            <Banana size={32} className="mr-1"/> {/* Default to desktop size for SSR */}
            <span>Controle de Doces</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-1 bg-primary">
            {navLinks.map(link => {
                const Icon = link.icon;
                const iconElement = link.label === "Saída" ? <Icon size={16} className="-scale-x-100" /> : <Icon size={16} />;
                return (
                    <Button key={link.href} variant="ghost" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/80 btn-animated px-3 py-2">
                    <Link href={link.href} className="flex items-center gap-1.5">
                        {iconElement}
                        <span>{link.label}</span>
                    </Link>
                    </Button>
                );
            })}
            </nav>
        </div>
      </header>
    );
  }

  // After mounting, we can safely use the actual `isMobile` value
  // You can adjust py-6 (vertical padding for height) and px-8 (horizontal padding for content width) 
  // on the div below to change header dimensions.
  // Icon sizes (e.g., Banana size={isMobile ? 28 : 32}) also contribute to height.
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-8 py-6 flex justify-between items-center">  {/* Example: Large padding */}
        <Link href="/produtos" className="flex items-center gap-2 text-xl sm:text-2xl font-bold font-headline hover:opacity-80 transition-opacity">
          <Banana size={isMobile ? 28 : 32} className="mr-1"/>
          <span>Controle de Doces</span>
        </Link>
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </div>
    </header>
  );
};

export default Header;
