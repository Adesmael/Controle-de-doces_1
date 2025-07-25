
import type {
  FinancialTransactionType,
  FinancialTransactionCategory,
  FinancialTransactionPaymentMethod,
  FinancialTransactionStatus
} from './finance-constants';

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
  supplierId: string;
  productId: string;
  quantity: number;
  unitPrice: number; // Represents the cost per unit (Custo Unitário)
}

export interface Entry extends Omit<EntryFormValues, 'supplierId'> {
  id: string;
  supplierId: string;
  supplierName?: string;
  totalValue: number; // Represents total cost (quantity * unitPrice)
  productName?: string;
}

export interface SaleFormValues {
  date: Date;
  clientId: string;
  productId: string;
  quantity: number;
  unitPrice: number; // Represents the selling price per unit (Preço de Venda Unitário)
  discount: number;
}

export interface Sale extends Omit<SaleFormValues, 'clientId'> {
  id: string;
  clientId: string;
  customerName?: string;
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


export interface DatePeriodSaleReport {
  period: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  sortableDate: string;
}

// Client Types
export interface ClientFormValues {
  registrationDate: Date;
  companyName: string; // Razão Social
  tradingName: string; // Fantasia
  category: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
}

export interface Client extends ClientFormValues {
  id: string;
}

// Supplier Types
export interface SupplierFormValues {
  registrationDate: Date;
  supplierName: string; // Fornecedor
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  suppliedProducts: string; // Produto (what they supply) - can be a comma-separated list or description
}

export interface Supplier extends SupplierFormValues {
  id: string;
}

// Financial Transaction Types
export interface FinancialTransactionFormValues {
  date: Date;
  type: FinancialTransactionType;
  originDestination: string; // Nome do cliente, fornecedor ou destino da movimentação
  description: string;
  value: number;
  category: FinancialTransactionCategory;
  paymentMethod: FinancialTransactionPaymentMethod;
  status: FinancialTransactionStatus;
  notes?: string; // Observações
}

export interface FinancialTransaction extends FinancialTransactionFormValues {
  id: string;
}
