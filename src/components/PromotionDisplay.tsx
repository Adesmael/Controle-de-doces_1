
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Promotion } from "@/lib/types";
import { Gift, Sparkles, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromotionDisplayProps {
  promotion: Promotion;
  onApply: (promotion: Promotion) => void;
  onRemove: () => void;
  isApplied: boolean;
}

const PromotionDisplay: React.FC<PromotionDisplayProps> = ({ promotion, onApply, onRemove, isApplied }) => {
  const { toast } = useToast();

  const handleApplyPromotion = () => {
    onApply(promotion);
    toast({
      title: "Promoção Aplicada!",
      description: "Desconto especial adicionado ao seu carrinho.",
    });
  };

  const handleRemovePromotion = () => {
    onRemove();
    toast({
      title: "Promoção Removida",
      description: "A promoção foi removida do seu carrinho.",
      variant: "destructive"
    });
  };

  return (
    <Alert className="bg-primary/10 border-primary/30 text-primary-foreground shadow-md">
      <Gift className="h-5 w-5 text-primary" />
      <AlertTitle className="font-headline text-lg text-primary flex items-center">
        <Sparkles size={20} className="mr-2 text-accent" /> Oferta Especial Para Você!
      </AlertTitle>
      <AlertDescription className="text-primary-foreground/80">
        {promotion.promotionMessage}
        {promotion.discountedProductId && promotion.discountPercentage && (
          <span className="block mt-1 font-medium">
            Ganhe {promotion.discountPercentage * 100}% de desconto no produto selecionado!
          </span>
        )}
      </AlertDescription>
      <div className="mt-4">
        {isApplied ? (
          <Button onClick={handleRemovePromotion} variant="destructive" className="w-full sm:w-auto btn-animated">
            <XCircle size={18} className="mr-2" /> Remover Promoção
          </Button>
        ) : (
          <Button onClick={handleApplyPromotion} variant="default" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 btn-animated">
            <Gift size={18} className="mr-2" /> Aplicar Promoção
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default PromotionDisplay;
