export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string; // Será obrigatório, com um placeholder se não fornecido pelo usuário
  stock: number;
  category: string;
  dataAiHint?: string;
}

export interface CartItem extends Product {
  quantity: number;
  originalPrice?: number; // To store price before discount
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  taxes: number; // Example tax, could be more complex
  total: number;
  customerName?: string; // Optional, for simplicity
  customerEmail?: string; // Optional
  promotionApplied?: {
    message: string;
    discountedProductId?: string;
    discountPercentage?: number;
  };
  createdAt: Date;
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
