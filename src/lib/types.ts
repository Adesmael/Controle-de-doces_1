
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string; 
  stock: number;
  category: string;
  dataAiHint?: string;
}

export interface Promotion {
  promotionMessage: string;
  discountedProductId?: string;
  discountPercentage?: number;
}

export interface EntryFormValues {
  date: Date;
  supplier: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Entry extends EntryFormValues {
  id: string;
  totalValue: number;
  productName?: string;
}

export interface SaleFormValues {
  date: Date;
  customer: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Sale extends SaleFormValues {
  id: string;
  totalValue: number;
  productName?: string;
}

// Usado internamente na RelatoriosPage para agregação e mapeamento inicial durante o processamento de dados
export interface ProductAnalysisData {
  productId: string;
  name: string;        // Nome do produto
  unitsSold: number;   // Total de unidades vendidas deste produto
  totalRevenue: number;// Receita total gerada por este produto
  totalCost: number;   // Custo total estimado para as unidades vendidas deste produto
  costCalculableSales: number; // Número de registros de venda deste produto para os quais um custo pôde ser calculado
  totalSalesRecords: number;   // Número total de registros de venda para este produto
}

// Usado para a exibição da tabela de lucratividade na RelatoriosPage, derivado de ProductAnalysisData
export interface SalesProfitData extends ProductAnalysisData {
  totalProfit: number;     // Lucro total estimado para este produto (Receita - Custo)
  profitMargin: number;    // Margem de lucro percentual para este produto
  costingCoverage: string; // String indicando a cobertura do cálculo de custo (ex: "5/5" ou "3/5")
}

    

    