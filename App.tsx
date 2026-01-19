import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, DailyReport } from './types';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { VolunteerSales } from './components/VolunteerSales'; 
import { ReportValidation } from './components/ReportValidation'; // NOVO
import { Inventory } from './components/Inventory';
import { Assistant } from './components/Assistant';
import { LayoutDashboard, ShoppingCart, Package, MessageSquare, Menu, Church, ClipboardList, CheckCircle } from 'lucide-react';

enum View {
  DASHBOARD,
  POS,
  VOLUNTEER_REPORT,
  VALIDATION, // NOVO
  INVENTORY,
  ASSISTANT
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS as any);
  
  // ESTADO DOS RELATÓRIOS (Começa vazio ou com um de teste)
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Voluntário Envia o Relatório
  const handleReportSubmit = (newReportData: Omit<DailyReport, 'id' | 'status'>) => {
    const newReport: DailyReport = {
        ...newReportData,
        id: `rep-${Date.now()}`,
        status: 'PENDENTE' // Vai para a Pastora
    };
    setReports(prev => [newReport, ...prev]);
    // Nota: NÃO gera transação ainda, nem baixa estoque. Só quando validar.
  };

  // 2. Pastora Valida o Relatório
  const handleValidateReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'VALIDADO' } : r));
    
    // AQUI SIM: Gera as transações para o Dashboard e Baixa Estoque
    const report = reports.find(r => r.id === reportId);
    if (report) {
        // Gera transações
        const newTrans: Transaction = {
            id: `tx-rep-${report.id}`,
            date: new Date().toISOString(),
            items: report.items.map(i => ({ 
                id: i.productName, // Simplificação (ideal ter ID real)
                name: i.productName,
                price: i.total / i.quantity,
                category: 'Outros' as any, // Simplificação
                stock: 0,
                quantity: i.quantity
            })),
            total: report.grandTotal,
            paymentMethod: 'Dinheiro' // Simplificação para dashboard geral
        };
        setTransactions(prev => [newTrans, ...prev]);

        // Baixa estoque (Lógica simplificada - ideal usar ID do produto)
        setProducts(prevProds => prevProds.map(prod => {
            const itemSold = report.items.find(i => i.productName === prod.name);
            if (itemSold) {
                return { ...prod, stock: prod.stock - itemSold.quantity };
            }
            return prod;
        }));
    }
  };

  // ... (Resto das funções de POS/Estoque mantidas) ...
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };
  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const NavItem = ({ view, icon: Icon, label, badge }: { view: View; icon: any; label: string, badge?: number }) => (
    <button
      onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-medium ${
        currentView === view ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <div className="relative">
        <Icon size={20} />
        {badge && badge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}
      </div>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-10 text-indigo-700">
            <div className="bg-indigo-100 p-2 rounded-lg"><Church size={28} /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Ecclesia</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel Geral" />
          <NavItem view={View.VOLUNTEER_REPORT} icon={ClipboardList} label="Relatório Voluntário" />
          
          {/* NOVA ABA PARA A PASTORA */}
          <NavItem 
            view={View.VALIDATION} 
            icon={CheckCircle} 
            label="Validação Pastoral" 
            badge={reports.filter(r => r.status === 'PENDENTE').length} 
          />
          
          <div className="my-4 border-t border-slate-100"></div>
          <NavItem view={View.POS} icon={ShoppingCart} label="Caixa Rápido" />
          <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          <NavItem view={View.ASSISTANT} icon={MessageSquare} label="Assistente IA" />
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all">
        <div className="max-w-7xl mx-auto">
          {currentView === View.DASHBOARD && <Dashboard transactions={transactions} products={products} />}
          {currentView === View.POS && <POS products={products} onCompleteSale={() => {}} />} {/* POS antigo mantido opcional */}
          
          {/* FLUXO NOVO */}
          {currentView === View.VOLUNTEER_REPORT && <VolunteerSales products={products} onSubmitReport={handleReportSubmit} />}
          {currentView === View.VALIDATION && <ReportValidation reports={reports} onValidate={handleValidateReport} />}
          
          {currentView === View.INVENTORY && <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} />}
          {currentView === View.ASSISTANT && <Assistant products={products} transactions={transactions} />}
        </div>
      </main>
    </div>
  );
};

export default App;
