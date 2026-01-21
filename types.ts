// ... (outros tipos mantidos iguais: Category, Product, CartItem, PaymentMethod, ReportItem, DailyReport)

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerTeam: string;
  customerPhone: string;
  checked?: boolean; // Para conferência pastoral
  delivered?: boolean; // <--- NOVO: Para saber se já entregou ao cliente
}

export interface OrderSheet {
  id: string;
  volunteerName: string;
  serviceType: string;
  date: string;
  items: OrderItem[];
  status: 'PENDENTE' | 'ENTREGUE'; // "ENTREGUE" aqui significa "Validado/Financeiro OK"
  validatedBy?: string;
  totalCash: number;
  totalPix: number;
  totalDebit: number;
  totalCredit: number;
  grandTotal: number;
}

// ... (Transaction e AdminUser mantidos iguais)
