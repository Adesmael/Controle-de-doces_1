
"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredProducts } from '@/lib/storage'; // Para obter o estoque real

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product: initialProduct }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const [currentProduct, setCurrentProduct] = useState<Product>(initialProduct);

  // Atualiza o estado do produto (principalmente o estoque) a partir do localStorage
  useEffect(() => {
    const allProducts = getStoredProducts();
    const updatedProduct = allProducts.find(p => p.id === initialProduct.id) || initialProduct;
    setCurrentProduct(updatedProduct);
  }, [initialProduct]);

  // Observa mudanças no localStorage para atualizar o estoque em tempo real
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'bananaBlissApp_products') {
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


  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast({
        title: "Quantidade Inválida",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive",
      });
      setQuantity(1);
      return;
    }
    if (quantity > currentProduct.stock) {
      toast({
        title: "Estoque Insuficiente",
        description: `Apenas ${currentProduct.stock} unidades de ${currentProduct.name} disponíveis.`,
        variant: "destructive",
      });
      setQuantity(currentProduct.stock > 0 ? currentProduct.stock : 1);
      return;
    }

    const addedSuccessfully = addToCart(currentProduct, quantity);
    if(addedSuccessfully){
      toast({
        title: "Produto Adicionado!",
        description: `${quantity}x ${currentProduct.name} adicionado(s) ao carrinho.`,
      });
    } else {
       toast({
        title: "Atenção",
        description: `Não foi possível adicionar a quantidade desejada de ${currentProduct.name} ao carrinho devido ao estoque.`,
        variant: "destructive",
      });
    }
    setQuantity(1); // Reset quantity after attempting to add to cart
  };

  const incrementQuantity = () => {
    if (quantity < currentProduct.stock) {
      setQuantity(prev => prev + 1);
    } else {
       toast({
        title: "Limite de Estoque Atingido",
        description: `Você já selecionou o máximo de ${currentProduct.stock} unidades para ${currentProduct.name}.`,
        variant: "destructive",
      });
    }
  };
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

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
        {currentProduct.stock > 0 ? (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Button variant="outline" size="icon" onClick={decrementQuantity} aria-label="Diminuir quantidade" className="btn-animated">
                <MinusCircle size={18} />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, currentProduct.stock)))}
                min="1"
                max={currentProduct.stock}
                className="w-16 text-center h-9"
                aria-label="Quantidade do produto"
              />
              <Button variant="outline" size="icon" onClick={incrementQuantity} aria-label="Aumentar quantidade" className="btn-animated">
                <PlusCircle size={18} />
              </Button>
            </div>
            <Button onClick={handleAddToCart} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
              <ShoppingCart size={18} className="mr-2" /> Adicionar ao Carrinho
            </Button>
          </div>
        ) : (
          <Button disabled className="w-full opacity-70">Fora de Estoque</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
