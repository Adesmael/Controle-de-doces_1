"use client";

import Image from 'next/image';
import type { CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface CartItemDisplayProps {
  item: CartItem;
}

const CartItemDisplay: React.FC<CartItemDisplayProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > item.stock) {
      toast({
        title: "Estoque Insuficiente",
        description: `Apenas ${item.stock} unidades de ${item.name} disponíveis.`,
        variant: "destructive",
      });
      updateQuantity(item.id, item.stock);
      return;
    }
    updateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.id);
    toast({
      title: "Produto Removido",
      description: `${item.name} foi removido do carrinho.`,
    });
  };
  
  const incrementQuantity = () => {
    if (item.quantity < item.stock) {
      handleQuantityChange(item.quantity + 1);
    } else {
       toast({
        title: "Limite de Estoque",
        description: `Você atingiu o máximo de ${item.stock} unidades para ${item.name}.`,
        variant: "destructive",
      });
    }
  };
  const decrementQuantity = () => handleQuantityChange(Math.max(1, item.quantity - 1));

  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden">
        <Image 
          src={item.imageUrl} 
          alt={item.name} 
          fill 
          sizes="(max-width: 640px) 80px, 96px"
          className="object-cover" 
          data-ai-hint={item.dataAiHint || "food product"}
        />
      </div>
      <div className="flex-grow">
        <h3 className="text-lg font-semibold font-headline">{item.name}</h3>
        <p className="text-sm text-muted-foreground">
          Preço: R$ {item.price.toFixed(2)} 
          {item.originalPrice && item.originalPrice !== item.price && (
            <span className="line-through ml-2 text-xs">R$ {item.originalPrice.toFixed(2)}</span>
          )}
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Button variant="outline" size="icon" onClick={decrementQuantity} aria-label="Diminuir quantidade" className="h-8 w-8 btn-animated">
            <MinusCircle size={16} />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max={item.stock}
            className="w-14 h-8 text-center"
            aria-label={`Quantidade de ${item.name}`}
          />
          <Button variant="outline" size="icon" onClick={incrementQuantity} aria-label="Aumentar quantidade" className="h-8 w-8 btn-animated">
            <PlusCircle size={16} />
          </Button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-lg">R$ {(item.price * item.quantity).toFixed(2)}</p>
        <Button variant="ghost" size="icon" onClick={handleRemove} aria-label={`Remover ${item.name} do carrinho`} className="text-destructive hover:text-destructive/80 mt-1 btn-animated">
          <Trash2 size={20} />
        </Button>
      </div>
    </div>
  );
};

export default CartItemDisplay;
