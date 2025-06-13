
"use client";

import ProductCard from '@/components/ProductCard';
import { Banana } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStoredProducts } from '@/lib/storage';
import type { Product } from '@/lib/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(getStoredProducts());
  }, []);
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'bananaBlissApp_products') {
        setProducts(getStoredProducts());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/20 via-background to-primary/20 rounded-lg shadow-sm">
        <div className="container mx-auto px-4">
        <Banana size={64} className="mx-auto text-primary mb-4 animate-bounce" />
          <h1 className="text-4xl font-bold font-headline text-primary-foreground mb-2">
            Bem-vindo à Banana Bliss Ticketing!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra nossos deliciosos doces de banana, feitos com os melhores ingredientes e muito carinho.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-6 text-center text-primary-foreground">Nossos Produtos</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Nenhum produto disponível no momento.</p>
        )}
      </section>
    </div>
  );
}
