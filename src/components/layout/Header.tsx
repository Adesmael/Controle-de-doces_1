
"use client";

import Link from 'next/link';
import { Banana, LayoutGrid, ArrowRightLeft, Package, BarChart3, Settings, FileSpreadsheet } from 'lucide-react';
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
  { href: "/saida", label: "Saída", icon: ArrowRightLeft },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/estoque", label: "Estoque", icon: LayoutGrid },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/relatorios-detalhados", label: "Relatórios Detalhados", icon: FileSpreadsheet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const Header = () => {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  const DesktopNav = () => (
    <nav className="flex items-center space-x-1">
      {navLinks.map(link => (
        <Button key={link.href} variant="ghost" asChild className="text-sm font-medium text-primary-foreground hover:bg-primary/80 btn-animated">
          <Link href={link.href} className="flex items-center gap-1.5 px-2">
            <link.icon size={16} />
            {link.label}
          </Link>
        </Button>
      ))}
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
          {navLinks.map(link => (
            <Button key={link.href} variant="ghost" asChild className="justify-start text-md" onClick={closeMobileNav}>
              <Link href={link.href} className="flex items-center gap-3">
                <link.icon size={20} />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );


  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/produtos" className="flex items-center gap-2 text-2xl font-bold font-headline hover:opacity-80 transition-opacity">
          <Banana size={32} />
          Controle de Doces
        </Link>
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </div>
    </header>
  );
};

export default Header;

