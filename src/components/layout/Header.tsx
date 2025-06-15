
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
import { useState } from 'react';


const navLinks = [
  { href: "/entrada", label: "Entrada", icon: ArrowRightLeft },
  { href: "/saida", label: "Saída", icon: ArrowRightLeft }, // icon is -scale-x-100 on actual render if needed
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

  const closeMobileNav = () => setMobileNavOpen(false);

  const DesktopNav = () => (
    <nav className="flex items-center space-x-1 bg-primary"> {/* Ensures nav bar itself has primary background */}
      {navLinks.map(link => {
        const Icon = link.icon;
        // Apply flip to Saida icon if that's the one
        const iconElement = link.label === "Saída" ? <Icon size={16} className="-scale-x-100" /> : <Icon size={16} />;
        return (
            <Button key={link.href} variant="ghost" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/80 btn-animated px-3 py-2">
            <Link href={link.href} className="flex items-center gap-1.5">
                {iconElement}
                {link.label}
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
            Controle de Doces
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
                    {link.label}
                </Link>
                </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );


  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/produtos" className="flex items-center gap-2 text-xl sm:text-2xl font-bold font-headline hover:opacity-80 transition-opacity">
          <Banana size={isMobile ? 28 : 32} className="mr-1"/>
          Controle de Doces
        </Link>
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </div>
    </header>
  );
};

export default Header;

