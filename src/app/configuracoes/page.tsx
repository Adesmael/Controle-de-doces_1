
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, DownloadCloud, UploadCloud, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getBackupData, restoreBackupData, type BackupData } from "@/lib/storage";
import React, { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState<BackupData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);


  const handleBackup = async () => {
    setIsProcessing(true);
    try {
      const backupData = await getBackupData();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `controle_doces_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Backup Realizado!",
        description: "Os dados foram exportados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao fazer backup:", error);
      toast({
        title: "Erro no Backup",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text) as BackupData;
        // Basic validation for top-level keys
        if (jsonData && typeof jsonData.products === 'object' && typeof jsonData.entries === 'object' && typeof jsonData.sales === 'object') {
          setPendingBackupData(jsonData);
          setShowRestoreConfirm(true);
        } else {
          throw new Error("Formato de arquivo de backup inválido. Estrutura esperada não encontrada.");
        }
      } catch (error) {
        console.error("Erro ao importar arquivo:", error);
        toast({
          title: "Erro na Importação",
          description: `Não foi possível ler o arquivo de backup. Verifique se é um JSON válido e com a estrutura correta. ${error instanceof Error ? error.message : ''}`,
          variant: "destructive",
        });
        setPendingBackupData(null);
      }
    };
    reader.readAsText(file);
    if (event.target) { // Clear the input value to allow re-selecting the same file
        event.target.value = "";
    }
  };

  const confirmRestore = async () => {
    if (pendingBackupData) {
      setIsProcessing(true);
      setShowRestoreConfirm(false); // Close dialog before processing
      try {
        await restoreBackupData(pendingBackupData);
        toast({
          title: "Backup Restaurado!",
          description: "Os dados foram importados com sucesso. Recarregue outras páginas abertas para ver as atualizações.",
        });
      } catch (error) {
         console.error("Erro ao restaurar backup:", error);
         toast({
          title: "Erro ao Restaurar",
          description: "Não foi possível restaurar os dados. Verifique o console para mais detalhes.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setPendingBackupData(null);
        // Consider prompting user to refresh or navigating them if critical data changed
        // window.location.reload(); // This is a hard refresh, might not always be desired
      }
    } else {
        setShowRestoreConfirm(false);
        setPendingBackupData(null);
    }
  };


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
          <CardDescription className="text-primary-foreground/80">
           Gerencie backups e outras configurações do sistema. <br/>
           Nota: O sistema agora utiliza IndexedDB para armazenamento de dados, permitindo maior capacidade e melhor performance para grandes volumes de dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-foreground/90">Backup de Dados</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Realize o backup dos seus dados (produtos, entradas, saídas) para um arquivo JSON.
            </p>
            <Button onClick={handleBackup} className="w-full sm:w-auto btn-animated bg-accent text-accent-foreground hover:bg-accent/90" disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <DownloadCloud size={18} className="mr-2" /> Fazer Backup
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-foreground/90">Importação de Backup</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Importe dados de um backup (arquivo JSON) previamente realizado. Isso sobrescreverá os dados atuais.
            </p>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <AlertDialog open={showRestoreConfirm} onOpenChange={(open) => { if(!isProcessing) setShowRestoreConfirm(open); }}>
              <AlertDialogTrigger asChild>
                 <Button onClick={handleImportTrigger} variant="outline" className="w-full sm:w-auto btn-animated" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <UploadCloud size={18} className="mr-2" /> Importar Backup
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center"><AlertTriangle className="text-destructive mr-2"/>Confirmar Restauração</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja restaurar os dados deste arquivo de backup?
                    Esta ação não pode ser desfeita e <strong className="text-destructive">sobrescreverá todos os dados existentes</strong> (produtos, entradas, saídas).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {if(!isProcessing) setPendingBackupData(null)}}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmRestore} className="bg-destructive hover:bg-destructive/90" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Restaurar Dados
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
