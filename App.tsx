import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, CartItem, PaymentMethod } from './types';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { VolunteerSales } from './components/VolunteerSales'; // Importe Novo
import { Inventory } from './components/Inventory';
import { Assistant } from './components/Assistant';
import { LayoutDashboard, ShoppingCart, Package, MessageSquare, Menu, Church, ClipboardList } from 'lucide-react';

enum View {
  DASHBOARD,
  POS,
  VOLUNTEER_SALES, // Nova View
  INVENTORY,
  ASSISTANT
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  // Garante que o tipo seja compatível, usando 'as any' temporariamente se der erro de tipo nos dados antigos
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS as any); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Função Única para processar vendas (seja do Caixa Rápido ou dos Voluntários)
  const handleSaleComplete = (
      items: CartItem[], 
      total: number, 
      method: PaymentMethod,
      volunteerData?: { name: string; service: string; date: string; time: string }
    ) => {
    
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      items,
      total,
      paymentMethod: method,
      // Se vier dados do voluntário (da aba nova), salva junto
      volunteerName: volunteerData?.name,
      serviceType: volunteerData?.service,
      serviceDate: volunteerData?.date,
      serviceTime: volunteerData?.time
    };
    
    setTransactions(prev => [newTransaction, ...prev]);

    setProducts(prev => prev.map(p => {
      const soldItem = items.find(i => i.id === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock - soldItem.quantity };
      }
      return p;
    }));
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-medium ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
          : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-10 text-indigo-700">
            <div className="bg-indigo-100 p-2 rounded-lg">
                 <Church size={28} />
            </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Ecclesia</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel Geral" />
          <NavItem view={View.VOLUNTEER_SALES} icon={ClipboardList} label="Relatório Voluntário" />
          <NavItem view={View.POS} icon={ShoppingCart} label="Caixa Rápido" />
          <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          <NavItem view={View.ASSISTANT} icon={MessageSquare} label="Assistente IA" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                    A
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-700">Admin</p>
                    <p className="text-xs text-slate-400">Voluntário Líder</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white z-20 border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <Church className="text-indigo-600" />
            <span className="font-bold text-lg text-slate-800">Ecclesia</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-800/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-3/4 h-full p-6" onClick={e => e.stopPropagation()}>
             <div className="flex items-center gap-3 mb-10 text-indigo-700">
                <Church size={24} />
                <h1 className="text-xl font-bold text-slate-800">Ecclesia Vendas</h1>
            </div>
            <nav className="space-y-2">
              <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel Geral" />
              <NavItem view={View.VOLUNTEER_SALES} icon={ClipboardList} label="Relatório Voluntário" />
              <NavItem view={View.POS} icon={ShoppingCart} label="Caixa Rápido" />
              <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
              <NavItem view={View.ASSISTANT} icon={MessageSquare} label="Assistente IA" />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all">
        <div className="max-w-7xl mx-auto">
          {currentView === View.DASHBOARD && <Dashboard transactions={transactions} products={products} />}
          {currentView === View.POS && <POS products={products} onCompleteSale={(items, total, method) => handleSaleComplete(items, total, method)} />}
          
          {/* AQUI ESTÁ A NOVA ABA SENDO RENDERIZADA */}
          {currentView === View.VOLUNTEER_SALES && <VolunteerSales products={products} onCompleteSale={handleSaleComplete} />}
          
          {currentView === View.INVENTORY && <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} />}
          {currentView === View.ASSISTANT && <Assistant products={products} transactions={transactions} />}
        </div>
      </main>
    </div>
  );
};

export default App;
