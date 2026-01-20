import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, DailyReport, OrderSheet, AdminUser } from './types';
import { Dashboard } from './components/Dashboard';
import { VolunteerSales } from './components/VolunteerSales'; 
import { ReportValidation } from './components/ReportValidation';
import { Orders } from './components/Orders'; 
import { Inventory } from './components/Inventory';
import { Settings } from './components/Settings'; 
import { LayoutDashboard, Package, Menu, Church, ClipboardList, CheckCircle, ShoppingBag, Settings as SettingsIcon } from 'lucide-react';

enum View { DASHBOARD, VOLUNTEER_REPORT, ORDERS, VALIDATION, INVENTORY, SETTINGS }

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS as any);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [orders, setOrders] = useState<OrderSheet[]>([]); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- CONFIGURAÇÕES ---
  const [availableVolunteers, setAvailableVolunteers] = useState<string[]>(['Eloá Batista', 'Thiago Rodrigues']);
  const [availableServices, setAvailableServices] = useState<string[]>(['Culto da Família', 'Culto Profético', 'Arena', 'Culto de Fé e Milagres']);
  
  // --- ADMINISTRAÇÃO (Login) ---
  const [admins, setAdmins] = useState<AdminUser[]>([
    { id: '1', name: 'Pastora', email: 'adm@ecclesia.com', password: '123' } // Admin padrão
  ]);

  const addVolunteer = (name: string) => setAvailableVolunteers(prev => [...prev, name]);
  const removeVolunteer = (name: string) => setAvailableVolunteers(prev => prev.filter(v => v !== name));
  const addService = (service: string) => setAvailableServices(prev => [...prev, service]);
  const removeService = (service: string) => setAvailableServices(prev => prev.filter(s => s !== service));
  
  // Gestão de Admins
  const addAdmin = (newAdmin: Omit<AdminUser, 'id'>) => setAdmins(prev => [...prev, { ...newAdmin, id: Date.now().toString() }]);
  const removeAdmin = (id: string) => setAdmins(prev => prev.filter(a => a.id !== id));

  // ... (Funções handleReportSubmit, handleOrderSubmit, handleValidate... IGUAIS AO CÓDIGO ANTERIOR) ...
  const handleReportSubmit = (newReportData: Omit<DailyReport, 'id' | 'status'>) => { setReports(prev => [{ ...newReportData, id: `rep-${Date.now()}`, status: 'PENDENTE' }, ...prev]); };
  const handleOrderSubmit = (newOrderData: Omit<OrderSheet, 'id' | 'status'>) => { setOrders(prev => [{ ...newOrderData, id: `ord-${Date.now()}`, status: 'PENDENTE' }, ...prev]); };
  
  const handleToggleReportItem = (reportId: string, itemIndex: number) => { setReports(prev => prev.map(r => r.id === reportId ? { ...r, items: r.items.map((it, idx) => idx === itemIndex ? { ...it, checked: !it.checked } : it) } : r)); };
  const handleToggleOrderItem = (orderId: string, itemIndex: number) => { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: o.items.map((it, idx) => idx === itemIndex ? { ...it, checked: !it.checked } : it) } : o)); };

  const handleValidateReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'VALIDADO' } : r));
    const report = reports.find(r => r.id === reportId);
    if (report) {
        const newTrans: Transaction = { id: `tx-rep-${report.id}`, date: new Date().toISOString(), items: report.items.map(i => ({ id: i.productName, name: i.productName, price: i.total / i.quantity, category: 'Outros' as any, stock: 0, quantity: i.quantity })), total: report.grandTotal, paymentMethod: 'Dinheiro' };
        setTransactions(prev => [newTrans, ...prev]);
        setProducts(prevProds => prevProds.map(prod => { const itemSold = report.items.find(i => i.productName === prod.name); return itemSold ? { ...prod, stock: prod.stock - itemSold.quantity } : prod; }));
    }
  };
  const handleUnvalidateReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'PENDENTE' } : r));
    setTransactions(prev => prev.filter(t => t.id !== `tx-rep-${reportId}`));
    const report = reports.find(r => r.id === reportId);
    if (report) { setProducts(prevProds => prevProds.map(prod => { const itemSold = report.items.find(i => i.productName === prod.name); return itemSold ? { ...prod, stock: prod.stock + itemSold.quantity } : prod; })); }
  };
  const handleValidateOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ENTREGUE' } : o));
    const orderSheet = orders.find(o => o.id === orderId);
    if (orderSheet) {
        const newTrans: Transaction = { id: `tx-ord-${orderSheet.id}`, date: new Date().toISOString(), items: orderSheet.items.map(i => ({ id: i.productName, name: i.productName, price: i.total / i.quantity, category: 'Outros' as any, stock: 0, quantity: i.quantity })), total: orderSheet.grandTotal, paymentMethod: 'Dinheiro' };
        setTransactions(prev => [newTrans, ...prev]);
    }
  };
  const handleUnvalidateOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PENDENTE' } : o));
    setTransactions(prev => prev.filter(t => t.id !== `tx-ord-${orderId}`));
  };

  const handleUpdateProduct = (updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  const handleAddProduct = (newProduct: Product) => setProducts(prev => [...prev, newProduct]);
  const handleDeleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

  const NavItem = ({ view, icon: Icon, label, badge }: any) => (
    <button onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-medium ${currentView === view ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
      <div className="relative"><Icon size={20} />{badge && badge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}</div><span>{label}</span>
    </button>
  );
  const pendingCount = reports.filter(r => r.status === 'PENDENTE').length + orders.filter(o => o.status === 'PENDENTE').length;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-10 text-indigo-700"><div className="bg-indigo-100 p-2 rounded-lg"><Church size={28} /></div><h1 className="text-2xl font-bold tracking-tight text-slate-800">Ecclesia</h1></div>
        <nav className="space-y-2 flex-1">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel Geral" />
          <NavItem view={View.VOLUNTEER_REPORT} icon={ClipboardList} label="Relatório Voluntário" />
          <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
          <NavItem view={View.VALIDATION} icon={CheckCircle} label="Validação Pastoral" badge={pendingCount} />
          <div className="my-4 border-t border-slate-100"></div>
          <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          <div className="mt-auto pt-4"><NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" /></div>
        </nav>
      </aside>
      <div className="lg:hidden fixed top-0 w-full bg-white z-20 border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm"><div className="flex items-center gap-2"><Church className="text-indigo-600" /><span className="font-bold text-lg text-slate-800">Ecclesia</span></div><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600"><Menu size={24} /></button></div>
      {mobileMenuOpen && (<div className="lg:hidden fixed inset-0 z-30 bg-slate-800/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}><div className="bg-white w-3/4 h-full p-6" onClick={e => e.stopPropagation()}><nav className="space-y-2"><NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel Geral" /><NavItem view={View.VOLUNTEER_REPORT} icon={ClipboardList} label="Relatório Voluntário" /><NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" /><NavItem view={View.VALIDATION} icon={CheckCircle} label="Validação Pastoral" badge={pendingCount} /><NavItem view={View.INVENTORY} icon={Package} label="Estoque" /><div className="border-t border-slate-100 my-2 pt-2"><NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" /></div></nav></div></div>)}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all">
        <div className="max-w-7xl mx-auto">
          {currentView === View.DASHBOARD && <Dashboard transactions={transactions} products={products} />}
          {currentView === View.VOLUNTEER_REPORT && <VolunteerSales products={products} onSubmitReport={handleReportSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />}
          {currentView === View.ORDERS && <Orders products={products} onSubmitOrders={handleOrderSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />}
          {currentView === View.VALIDATION && (
            <ReportValidation 
                reports={reports} orders={orders} 
                admins={admins} // <--- PASSANDO ADMINS
                onValidateReport={handleValidateReport} onValidateOrder={handleValidateOrder}
                onUnvalidateReport={handleUnvalidateReport} onUnvalidateOrder={handleUnvalidateOrder}
                onToggleReportItem={handleToggleReportItem} onToggleOrderItem={handleToggleOrderItem}
            />
          )}
          {currentView === View.INVENTORY && <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />}
          {currentView === View.SETTINGS && <Settings volunteers={availableVolunteers} services={availableServices} admins={admins} onAddVolunteer={addVolunteer} onRemoveVolunteer={removeVolunteer} onAddService={addService} onRemoveService={removeService} onAddAdmin={addAdmin} onRemoveAdmin={removeAdmin} />}
        </div>
      </main>
    </div>
  );
};

export default App;
