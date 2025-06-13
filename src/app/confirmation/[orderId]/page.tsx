
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Download, Printer, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOrder = localStorage.getItem('latestOrder');
      if (storedOrder) {
        const parsedOrder: Order = JSON.parse(storedOrder);
        // Check if the stored order matches the current orderId from URL
        if (parsedOrder.id === orderId) {
          setOrder(parsedOrder);
          // Generate QR code URL (example using a public API)
          const orderDataForQR = `Pedido: ${parsedOrder.id}, Total: R$${parsedOrder.total.toFixed(2)}, Itens: ${parsedOrder.items.length}`;
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderDataForQR)}`);
        } else {
          // If orderId doesn't match, it might be an old order or direct navigation.
          // For this example, we clear it. A real app would fetch from a backend.
          setOrder(null);
        }
      }
    }
  }, [orderId]);

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold font-headline mb-4">Pedido não encontrado</h1>
        <p className="text-muted-foreground mb-8">
          Não foi possível carregar os detalhes do seu pedido. Verifique o link ou tente novamente.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
          <Link href="/">Voltar para Loja</Link>
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center bg-primary/10">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold font-headline text-primary-foreground">Pedido Confirmado!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Obrigado pela sua compra! Seu pedido <strong className="text-primary">{order.id}</strong> foi realizado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div>
            <h3 className="text-xl font-semibold mb-2 font-headline">Detalhes do Pedido:</h3>
            <p><strong>Data do Pedido:</strong> {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p><strong>Total Pago:</strong> <span className="font-bold text-lg">R$ {order.total.toFixed(2)}</span></p>
            {order.promotionApplied && (
              <p className="text-sm text-green-600"><strong>Promoção Aplicada:</strong> {order.promotionApplied.promotionMessage}</p>
            )}
          </div>
          
          <div className="space-y-2">
             <h4 className="text-lg font-semibold font-headline">Itens Comprados:</h4>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-muted/20 rounded-md">
                <span>{item.name} (x{item.quantity})</span>
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {qrCodeUrl && (
            <div className="text-center space-y-3 p-4 border border-dashed rounded-md bg-background">
              <h3 className="text-xl font-semibold font-headline">Seu Ticket QR Code:</h3>
              <p className="text-sm text-muted-foreground">Apresente este QR code para retirar seu pedido.</p>
              <Image 
                src={qrCodeUrl} 
                alt={`QR Code para Pedido ${order.id}`} 
                width={200} 
                height={200}
                className="mx-auto rounded-md shadow-md"
                data-ai-hint="qr code"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-around gap-4 p-6 bg-muted/20">
          <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto btn-animated">
            <Printer size={18} className="mr-2" /> Imprimir Ticket (Simulado)
          </Button>
          {/* Placeholder for PDF download */}
          <Button variant="outline" className="w-full sm:w-auto btn-animated" disabled>
            <Download size={18} className="mr-2" /> Baixar PDF (Em breve)
          </Button>
        </CardFooter>
      </Card>
      <div className="text-center mt-8">
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
          <Link href="/">Continuar Comprando</Link>
        </Button>
      </div>
    </div>
  );
}
