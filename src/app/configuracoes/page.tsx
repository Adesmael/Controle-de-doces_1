
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, DownloadCloud, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfiguracoesPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center gap-3">
            <Settings size={32} className="text-primary" />
            <CardTitle className="text-2xl font-headline text-primary-foreground">
              Configurações do Sistema
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-foreground/90">Backup de Dados</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Realize o backup dos seus dados para garantir a segurança das informações.
            </p>
            <Button className="w-full sm:w-auto btn-animated bg-accent text-accent-foreground hover:bg-accent/90">
              <DownloadCloud size={18} className="mr-2" /> Fazer Backup (Simulado)
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-foreground/90">Importação de Backup</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Importe dados de um backup previamente realizado.
            </p>
            <Button variant="outline" className="w-full sm:w-auto btn-animated">
              <UploadCloud size={18} className="mr-2" /> Importar Backup (Simulado)
            </Button>
          </div>
          {/* Outras configurações podem ser adicionadas aqui */}
        </CardContent>
      </Card>
    </div>
  );
}
