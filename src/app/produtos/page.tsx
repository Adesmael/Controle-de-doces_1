
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function ProdutosPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="bg-primary/10">
           <div className="flex items-center gap-3">
            <Package size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Gerenciamento de Produtos
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Adicione, edite ou remova produtos do catálogo.
          </p>
          {/* Conteúdo da página de produtos será adicionado aqui */}
        </CardContent>
      </Card>
    </div>
  );
}
