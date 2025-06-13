
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

export default function EstoquePage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <LayoutGrid size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Controle de Estoque
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Visualize os níveis de estoque atuais dos seus produtos.
          </p>
          {/* Conteúdo da página de estoque será adicionado aqui */}
        </CardContent>
      </Card>
    </div>
  );
}
