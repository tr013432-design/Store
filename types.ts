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

// Atualizado para incluir as formas de pagamento específicas da igreja
export type PaymentMethod = 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito (1x)' | 'Cartão Crédito (2x)' | 'Cartão Crédito (3x)' | 'Pix';

export interface Transaction {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  // Novos campos para o relatório da Pastora
  volunteerName?: string;
  serviceType?: string; // Ex: Culto de Domingo, Rede de Jovens
  serviceDate?: string; // Dia do culto
  serviceTime?: string; // Horário
}

export interface SalesSummary {
  totalRevenue: number;
  totalTransactions: number;
  topProduct: string;
}
