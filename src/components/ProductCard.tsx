"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (quantity > product.stock) {
      toast({
        title: "Estoque Insuficiente",
        description: `Apenas ${product.stock} unidades de ${product.name} disponíveis.`,
        variant: "destructive",
      });
      setQuantity(product.stock);
      return;
    }
    if (quantity <= 0) {
      toast({
        title: "Quantidade Inválida",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive",
      });
      setQuantity(1);
      return;
    }
    addToCart(product, quantity);
    toast({
      title: "Produto Adicionado!",
      description: `${quantity}x ${product.name} adicionado(s) ao carrinho.`,
    });
    setQuantity(1); // Reset quantity after adding to cart
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    } else {
       toast({
        title: "Limite de Estoque",
        description: `Você atingiu o máximo de ${product.stock} unidades para ${product.name}.`,
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
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={product.dataAiHint || "sweet food"}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-headline mb-1">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden">{product.description}</CardDescription>
        <p className="text-lg font-semibold text-primary mb-1">
          R$ {product.price.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {product.stock > 0 ? (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Button variant="outline" size="icon" onClick={decrementQuantity} aria-label="Diminuir quantidade" className="btn-animated">
                <MinusCircle size={18} />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, product.stock)))}
                min="1"
                max={product.stock}
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
          <Button disabled className="w-full">Fora de Estoque</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
