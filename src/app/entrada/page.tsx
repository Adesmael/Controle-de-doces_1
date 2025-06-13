
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";

export default function EntradaPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Registro de Entrada de Produtos
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Formulário para registrar a entrada de novos produtos no estoque.
          </p>
          {/* Formulário será adicionado aqui */}
        </CardContent>
      </Card>
    </div>
  );
}
