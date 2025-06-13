
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <BarChart3 size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Relatórios Gerenciais
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Acesse relatórios detalhados sobre vendas, estoque e mais.
          </p>
          {/* Conteúdo da página de relatórios será adicionado aqui */}
        </CardContent>
      </Card>
    </div>
  );
}
