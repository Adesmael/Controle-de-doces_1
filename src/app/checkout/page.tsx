"use client";

import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {useEffect} from 'react';

const TAX_RATE = 0.05; // Ensure this matches CartContext if used directly

export default function CheckoutPage() {
  const { cartItems, subtotal, taxes, total, clearCart, appliedPromotion, cartCount } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (cartCount === 0) {
      toast({
        title: "Carrinho Vazio",
        description: "Seu carrinho está vazio. Adicione itens antes de finalizar a compra.",
        variant: "destructive",
      });
      router.push('/');
    }
  }, [cartCount, router, toast]);


  const handleSubmitOrder = () => {
    // Simulate order submission
    const orderId = `BBT-${Date.now()}`; // Simple unique ID
    
    // For a real app, save order to database here
    // For this example, we'll pass order details via localStorage (not ideal for production)
    const orderData = {
      id: orderId,
      items: cartItems,
      subtotal,
      taxes,
      total,
      promotionApplied: appliedPromotion,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('latestOrder', JSON.stringify(orderData));

    clearCart();
    toast({
      title: "Pedido Realizado!",
      description: "Seu pedido foi processado com sucesso.",
      className: "bg-green-500 text-white",
    });
    router.push(`/confirmation/${orderId}`);
  };

  if (cartCount === 0) {
    // This is a fallback, useEffect should redirect.
    return <div className="text-center p-8">Redirecionando... Seu carrinho está vazio.</div>;
  }


  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <ShoppingBag size={48} className="mx-auto text-primary mb-3" />
          <CardTitle className="text-3xl font-bold font-headline">Revisão do Pedido</CardTitle>
          <CardDescription>Confirme os detalhes do seu pedido antes de finalizar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 font-headline">Itens do Pedido:</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-16 h-16 rounded overflow-hidden">
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill 
                        sizes="64px"
                        className="object-cover"
                        data-ai-hint={item.dataAiHint || "product image"}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x R$ {item.price.toFixed(2)}
                        {item.originalPrice && item.originalPrice !== item.price && (
                          <span className="line-through ml-1 text-xs">R$ {item.originalPrice.toFixed(2)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-3 font-headline">Resumo Financeiro:</h3>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-foreground font-medium">R$ {subtotal.toFixed(2)}</span>
              </div>
              {appliedPromotion && (
                <div className="flex justify-between text-green-600">
                  <span>Promoção Aplicada:</span>
                  <span className="font-medium">{appliedPromotion.promotionMessage.substring(0,30)}...</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxas ({(TAX_RATE * 100).toFixed(0)}%):</span>
                <span className="text-foreground font-medium">R$ {taxes.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-2xl font-bold text-foreground">
                <span>Total a Pagar:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmitOrder} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
            <CheckCircle size={20} className="mr-2" /> Confirmar e Pagar (Simulado)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
