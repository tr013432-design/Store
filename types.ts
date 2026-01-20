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
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
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
  validatedBy?: string; // <--- NOVO CAMPO: Nome do Admin que validou
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
}

export interface OrderSheet {
  id: string;
  volunteerName: string;
  serviceType: string;
  date: string;
  items: OrderItem[];
  status: 'PENDENTE' | 'ENTREGUE';
  validatedBy?: string; // <--- NOVO CAMPO
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
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
}
