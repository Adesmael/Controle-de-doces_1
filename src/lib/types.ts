export interface Product {
  id: string;
  name: string;
  description?: string; // Made description optional for simpler product creation
  price: number;
  imageUrl: string;
  stock: number;
  category: string; // e.g., 'Doce de Banana Tradicional', 'Doce de Banana com Chocolate'
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
