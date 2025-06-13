
"use client";

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import CartItemDisplay from '@/components/CartItemDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShoppingCart, Tag, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generatePromotion } from '@/ai/flows/generate-promotion';
import type { Promotion, Product as ProductType } from '@/lib/types';
import PromotionDisplay from '@/components/PromotionDisplay';
import { useToast } from '@/hooks/use-toast';
import { getStoredProducts } from '@/lib/storage'; // To get current inventory

export default function CartPage() {
  const { cartItems, subtotal, taxes, total, cartCount, clearCart, applyPromotion, removePromotion, appliedPromotion } = useCart();
  const [aiPromotion, setAiPromotion] = useState<Promotion | null>(null);
  const [isLoadingPromotion, setIsLoadingPromotion] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch promotion if cart is not empty, no promotion is applied, and not currently loading one.
    if (cartCount > 0 && !appliedPromotion && !isLoadingPromotion && !aiPromotion) {
      fetchPromotion();
    }
    if (cartCount === 0 && aiPromotion) { // Clear AI promotion if cart becomes empty
        setAiPromotion(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartCount, appliedPromotion]); // Re-evaluate when cartCount or appliedPromotion changes

  const fetchPromotion = async () => {
    setIsLoadingPromotion(true);
    try {
      // Mock user history for now
      const userPurchaseHistory = JSON.stringify([
        { productId: "1", quantity: 2, date: "2023-10-01" },
        { productId: "3", quantity: 1, date: "2023-10-15" },
      ]);
      
      const currentProducts = getStoredProducts();
      const inventoryForAI: ProductType[] = currentProducts
        .filter(p => p.stock > 0) // Only products with stock
        .map(p => ({ id: p.id, name: p.name, stock: p.stock, price: p.price, category: p.category }));

      const cartItemsForAI = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      if (inventoryForAI.length === 0) {
        setAiPromotion(null); // No products in stock to promote
        setIsLoadingPromotion(false);
        return;
      }
      
      const promotionData = await generatePromotion({ 
        userPurchaseHistory, 
        currentInventory: inventoryForAI,
        cartItems: cartItemsForAI 
      });

      if (promotionData && promotionData.promotionMessage) {
         setAiPromotion(promotionData);
      } else {
        setAiPromotion(null);
      }

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
    setAiPromotion(null); // Clear AI suggestion when cart is cleared
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
          {!isLoadingPromotion && aiPromotion && !appliedPromotion && ( // Show AI promo only if not already applied
            <PromotionDisplay 
              promotion={aiPromotion} 
              onApply={(promo) => {
                applyPromotion(promo);
                setAiPromotion(null); // Clear AI suggestion after applying
              }}
              onRemove={removePromotion} // This case might not be hit if only shown when not applied
              isApplied={false} // It's not applied yet if we are showing this version
            />
          )}
           {!isLoadingPromotion && !aiPromotion && cartCount > 0 && !appliedPromotion && ( // No AI promo and no manual promo
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
                  {/* This is a simplified display; actual discount value might need calculation in CartContext if not already handled by item price adjustment */}
                  <span className="font-medium text-sm">{appliedPromotion.promotionMessage.substring(0,25)}...</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxas ({(0.05 * 100).toFixed(0)}%):</span> {/* Direct use of TAX_RATE constant */}
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
              {appliedPromotion && (
                <Button variant="link" onClick={() => {removePromotion(); fetchPromotion(); /* try to get a new one */}} className="text-xs text-destructive">
                  Remover promoção aplicada
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
