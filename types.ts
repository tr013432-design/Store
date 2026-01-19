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
}

// NOVO: Estrutura do Relatório Completo (igual ao papel)
export interface DailyReport {
  id: string;
  volunteerName: string;
  serviceType: string;
  date: string;
  time: string;
  items: ReportItem[]; // As linhas da tabela
  notes: string; // "Retirada do Devocional"
  status: 'PENDENTE' | 'VALIDADO';
  totalCash: number;
  totalPix: number;
  totalDebit: number;
  totalCredit: number;
  grandTotal: number;
}

// Mantemos Transaction para o Dashboard, mas elas só serão criadas após a validação
export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
}
