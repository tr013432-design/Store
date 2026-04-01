// types.ts — VERSÃO CORRIGIDA

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

export interface CustomerHistoryEntry {
  date: string;
  description: string;
  value: number;
  pointsEarned: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  team?: string;
  church?: string;
  points: number;
  totalSpent: number;
  lastPurchase: string;
  history?: CustomerHistoryEntry[];
}

export type PaymentMethod =
  | 'Dinheiro'
  | 'Cartão Débito'
  | 'Cartão Crédito (1x)'
  | 'Cartão Crédito (2x)'
  | 'Cartão Crédito (3x)'
  | 'Pix'
  | 'Sara Points';

export interface ReportItem {
  productName: string;
  quantity: number;
  total: number;
  paymentMethod: PaymentMethod;
  checked?: boolean;
  customerPhone?: string;
}

export interface DailyReport {
  id: string;
  volunteerName: string;
  serviceType: string;
  date: string;
  time: string;
  items: ReportItem[];
  notes: string;
  status: 'PENDENTE' | 'VALIDADO' | 'DESVALIDADO';
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
  deliveredAt?: string;
}

export interface OrderSheet {
  id: string;
  volunteerName: string;
  serviceType: string;
  date: string;
  items: OrderItem[];
  status: 'PENDENTE' | 'ENTREGUE' | 'DESVALIDADO';
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
  totalCost?: number;
  paymentMethod: PaymentMethod;
  volunteerName?: string;
  serviceType?: string;
}

// ✅ CORRIGIDO: sem campo password
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export type ExpenseType = 'DESPESA' | 'SANGRIA';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  type: ExpenseType;
  date: string;
  user: string;
}

export interface VolunteerSchedule {
  id: string;
  unit_id?: string;
  date: string;
  serviceType: string;
  volunteerName: string;
  role?: string;
  notes?: string;
  created_at?: string;
}

// ✅ NOVO: configurações da unidade persistidas no Supabase
export interface UnitSettings {
  id?: string;
  unit_id: string;
  volunteers: string[];
  services: string[];
  points_config: Record<string, number>;
  points_value: number;
  updated_at?: string;
}
