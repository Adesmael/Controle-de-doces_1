"use client";

import Link from 'next/link';
import { ShoppingCart, Banana } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { cartCount } = useCart();

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline hover:opacity-80 transition-opacity">
          <Banana size={32} />
          Banana Bliss Ticketing
        </Link>
        <nav>
          <Link href="/cart" className="relative flex items-center gap-2 p-2 rounded-md hover:bg-primary/80 transition-colors btn-animated">
            <ShoppingCart size={24} />
            <span className="hidden sm:inline">Carrinho</span>
            {cartCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-0.5 text-xs">
                {cartCount}
              </Badge>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
