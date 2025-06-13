"use client";

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import CartItemDisplay from '@/components/CartItemDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Tag, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generatePromotion } from '@/ai/flows/generate-promotion';
import type { Promotion } from '@/lib/types';
import PromotionDisplay from '@/components/PromotionDisplay';
import { products as allProducts } from '@/lib/products'; // For inventory
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { cartItems, subtotal, taxes, total, cartCount, clearCart, applyPromotion, removePromotion, appliedPromotion } = useCart();
  const [aiPromotion, setAiPromotion] = useState<Promotion | null>(null);
  const [isLoadingPromotion, setIsLoadingPromotion] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (cartCount > 0 && !appliedPromotion) { // Fetch promotion if cart is not empty and no promotion is applied yet
      fetchPromotion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartCount]); // Only re-fetch if cartCount changes (e.g. item added/removed)

  const fetchPromotion = async () => {
    setIsLoadingPromotion(true);
    try {
      // Mock user history and inventory
      const userPurchaseHistory = JSON.stringify([
        { productId: "1", quantity: 2, date: "2023-10-01" },
        { productId: "3", quantity: 1, date: "2023-10-15" },
      ]);
      const currentInventory = JSON.stringify(
        allProducts.map(p => ({ id: p.id, name: p.name, stock: p.stock, price: p.price }))
      );

      const promotionData = await generatePromotion({ userPurchaseHistory, currentInventory });
      setAiPromotion(promotionData);
    } catch (error) {
      console.error("Error fetching AI promotion:", error);
      toast({
        title: "Erro ao buscar promoção",
        description: "Não foi possível carregar ofertas especiais no momento.",
        variant: "destructive",
      });
      setAiPromotion(null);
    } finally {
      setIsLoadingPromotion(false);
    }
  };
  
  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Carrinho Esvaziado",
      description: "Todos os itens foram removidos do seu carrinho.",
    });
  };

  if (cartCount === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart size={64} className="mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold font-headline mb-4">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-8">Adicione alguns doces deliciosos para começar!</p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
          <Link href="/">Continuar Comprando</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">Seu Carrinho de Compras</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Itens no Carrinho ({cartCount})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cartItems.map(item => (
                <CartItemDisplay key={item.id} item={item} />
              ))}
            </CardContent>
            <CardFooter className="p-4">
               <Button variant="outline" onClick={handleClearCart} className="text-destructive hover:border-destructive hover:text-destructive btn-animated">
                <Trash2 size={16} className="mr-2" /> Limpar Carrinho
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {isLoadingPromotion && (
            <div className="p-4 text-center text-muted-foreground">
              <Tag size={24} className="mx-auto mb-2 animate-pulse" />
              Buscando ofertas especiais...
            </div>
          )}
          {!isLoadingPromotion && aiPromotion && (
            <PromotionDisplay 
              promotion={aiPromotion} 
              onApply={applyPromotion}
              onRemove={removePromotion}
              isApplied={!!appliedPromotion && appliedPromotion.promotionMessage === aiPromotion.promotionMessage}
            />
          )}
           {!isLoadingPromotion && !aiPromotion && cartCount > 0 && (
             <Alert variant="default" className="bg-secondary/50 border-secondary">
              <AlertTriangle className="h-4 w-4 text-secondary-foreground" />
              <AlertTitle>Sem ofertas extras</AlertTitle>
              <AlertDescription>
                Nenhuma promoção especial disponível no momento. Mas nossos preços já são doces!
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-lg sticky top-24"> {/* Sticky summary card */}
            <CardHeader>
              <CardTitle className="text-xl font-headline">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
              </div>
              {appliedPromotion && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto Promocional:</span>
                  {/* This is a simplified display; actual discount value might need calculation */}
                  <span className="font-medium">Aplicado</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxas ({(TAX_RATE * 100).toFixed(0)}%):</span>
                <span className="font-medium">R$ {taxes.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3">
              <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
                <Link href="/checkout">
                  Finalizar Compra <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full btn-animated">
                <Link href="/">Continuar Comprando</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Example tax rate constant
const TAX_RATE = 0.05;
