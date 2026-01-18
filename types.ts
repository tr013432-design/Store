export enum Category {
  FOOD = 'Comida',
  DRINK = 'Bebida',
  BOOKSTORE = 'Livraria',
  CLOTHING = 'Vestuário',
  OTHER = 'Outros',
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// Novas formas de pagamento
export type PaymentMethod = 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito (1x)' | 'Cartão Crédito (2x)' | 'Cartão Crédito (3x)' | 'Pix';

export interface Transaction {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  // Campos novos para o relatório da Pastora
  volunteerName?: string;
  serviceType?: string; // Ex: Culto de Domingo
  serviceDate?: string; 
  serviceTime?: string;
}

export interface SalesSummary {
  totalRevenue: number;
  totalTransactions: number;
  topProduct: string;
}
