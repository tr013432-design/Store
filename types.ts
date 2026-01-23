// 1. CATEGORIAS ATUALIZADAS (Sem Comida, focadas nos seus produtos)
export enum Category {
  BOOKS_BIBLES = 'Livros e Bíblias',
  CLOTHING = 'Vestuário (Camisas/Bonés)',
  STATIONERY = 'Papelaria (Planner/Caneta/Blocos)',
  ACCESSORIES = 'Acessórios (Garrafas/Botons/Mochilas)',
  OTHER = 'Outros',
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  category: Category;
  stock: number;
  imageUrl?: string;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// 2. NOVO TIPO: CLIENTE (Para o Sara Points)
export interface Customer {
  id: string; // Telefone (WhatsApp)
  name: string;
  points: number;
  totalSpent: number;
  lastPurchase: string;
  history: {
    date: string;
    description: string;
    value: number;
    pointsEarned: number;
  }[];
}

export type PaymentMethod = 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito (1x)' | 'Cartão Crédito (2x)' | 'Cartão Crédito (3x)' | 'Pix';

export interface ReportItem {
  productName: string;
  quantity: number;
  total: number;
  paymentMethod: PaymentMethod;
  checked?: boolean;
}

export interface DailyReport {
  id: string;
  volunteerName: string;
  serviceType: string;
  date: string;
  time: string;
  items: ReportItem[];
  notes: string;
  status: 'PENDENTE' | 'VALIDADO';
  validatedBy?: string;
  totalCash: number;
  totalPix: number;
  totalDebit: number;
  totalCredit: number;
  grandTotal: number;
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerTeam: string;
  customerPhone: string;
  checked?: boolean;
  delivered?: boolean;
}

export interface OrderSheet {
  id: string;
  volunteerName: string;
  serviceType: string;
  date: string;
  items: OrderItem[];
  status: 'PENDENTE' | 'ENTREGUE';
  validatedBy?: string;
  totalCash: number;
  totalPix: number;
  totalDebit: number;
  totalCredit: number;
  grandTotal: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  volunteerName?: string;
  serviceType?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
}
