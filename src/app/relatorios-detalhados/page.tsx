// Esta página foi removida conforme solicitado.
// Você pode deletar este arquivo (src/app/relatorios-detalhados/page.tsx) do seu projeto.
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Info } from "lucide-react";

export default function RelatoriosDetalhadosRemovidoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary/5 text-primary-foreground">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Relatórios Detalhados (Removido)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
            <Info size={32} className="mb-2" />
            <p className="text-lg">Esta página de relatórios detalhados foi removida.</p>
            <p className="text-sm">Utilize a página principal de "Relatórios" para suas análises.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
