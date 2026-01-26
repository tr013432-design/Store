// src/types.ts

// 1. CATEGORIAS (Focadas nos produtos da Sara Store)
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
  costPrice?: number; // Essencial para o cálculo de Lucro Real
  category: Category;
  stock: number;
  imageUrl?: string;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// 2. CLIENTE (Completo com Equipe e Igreja)
export interface Customer {
  id: string; // ID é o telefone (apenas números)
  name: string;
  phone: string; // Telefone formatado (visual)
  team?: string;   // Equipe
  church?: string; // Igreja
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

// 3. PAGAMENTOS (Incluindo Sara Points)
export type PaymentMethod = 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito (1x)' | 'Cartão Crédito (2x)' | 'Cartão Crédito (3x)' | 'Pix' | 'Sara Points';

export interface ReportItem {
  productName: string;
  quantity: number;
  total: number;
  paymentMethod: PaymentMethod;
  checked?: boolean;
  customerPhone?: string; // Essencial para pontuar direto no relatório
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
  // Campos vitais para o Dashboard e Gamificação
  volunteerName?: string;
  serviceType?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

// --- NOVO: GESTÃO DE DESPESAS E SANGRIA ---
export type ExpenseType = 'DESPESA' | 'SANGRIA';

export interface Expense {
  id: string;
  description: string; // Ex: "Sacolas", "Frete", "Material de Limpeza"
  amount: number;      // Valor R$
  type: ExpenseType;   // DESPESA (Gasto que reduz lucro) ou SANGRIA (Retirada de caixa)
  date: string;        // Data ISO
  user: string;        // Quem lançou (Admin/Voluntário)
}
