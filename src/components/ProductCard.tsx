
"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getStoredProducts } from '@/lib/storage';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product: initialProduct }) => {
  const [currentProduct, setCurrentProduct] = useState<Product>(initialProduct);

  useEffect(() => {
    const allProducts = getStoredProducts();
    const updatedProduct = allProducts.find(p => p.id === initialProduct.id) || initialProduct;
    setCurrentProduct(updatedProduct);
  }, [initialProduct]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'bananaBlissApp_products' || event.key === 'controleDocesApp_products') { // Adjusted for name change
        const allProducts = getStoredProducts();
        const updatedProduct = allProducts.find(p => p.id === initialProduct.id);
        if (updatedProduct) {
          setCurrentProduct(updatedProduct);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialProduct.id]);

  return (
    <Card className="flex flex-col overflow-hidden product-card-animated shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
        <div className="aspect-[3/2] relative w-full">
          <Image
            src={currentProduct.imageUrl}
            alt={currentProduct.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={currentProduct.dataAiHint || "sweet food"}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-headline mb-1">{currentProduct.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden">{currentProduct.description}</CardDescription>
        <p className="text-lg font-semibold text-primary mb-1">
          R$ {currentProduct.price.toFixed(2)}
        </p>
        <p className={`text-xs ${currentProduct.stock === 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
          {currentProduct.stock > 0 ? `${currentProduct.stock} em estoque` :
            <span className="flex items-center"><AlertTriangle size={14} className="mr-1"/>Fora de estoque</span>
          }
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
         {/* Placeholder for potential future actions or info if needed */}
         <div className="w-full h-9"></div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
