
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

// Used internally in RelatoriosPage for aggregation
export interface ProductAnalysis {
  name: string;
  totalRevenue: number;
  totalCost: number;
  unitsSold: number;
  costCalculableSales: number; 
  totalSalesRecords: number;   
}

// Used for the profitability table display in RelatoriosPage
export interface SalesProfitData {
  productId: string;
  name: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  costingCoverage: string; 
  costCalculableSales: number;
  totalSalesRecords: number;
}



    