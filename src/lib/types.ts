export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number; // Selling price
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
  unitPrice: number; // Represents the cost per unit (Custo Unitário)
}

export interface Entry extends EntryFormValues {
  id: string;
  totalValue: number; // Represents total cost (quantity * unitPrice)
  productName?: string;
}

export interface SaleFormValues {
  date: Date;
  customer: string;
  productId: string;
  quantity: number;
  unitPrice: number; // Represents the selling price per unit (Preço de Venda Unitário)
  discount: number;
}

export interface Sale extends SaleFormValues {
  id: string;
  totalValue: number; // Represents total revenue for this sale ((quantity * unitPrice) - discount)
  productName?: string;
}

export interface ProductAnalysisData {
  productId: string;
  productName: string;        
  unitsSold: number;          
  totalRevenue: number;       
  totalCost: number;          
  totalSalesRecords: number;  
}

export interface SalesProfitData extends ProductAnalysisData {
  totalProfit: number;     
  profitMargin: number;    
}

export interface DetailedSaleItem extends Sale {
  netRevenue: number;
  unitCost?: number; 
  totalCost?: number; 
  profit?: number; 
  profitMargin?: number; 
  costCalculated: boolean; 
}

export interface CustomerSalesReport {
  customerName: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalUnitsSold: number;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  totalUnitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgProfitMargin?: number; 
}

export interface DatePeriodSaleReport { 
  period: string; 
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  sortableDate: string; 
}
    
