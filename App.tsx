import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, DailyReport, OrderSheet, AdminUser } from './types';
import { Dashboard } from './components/Dashboard';
import { VolunteerSales } from './components/VolunteerSales'; 
import { ReportValidation } from './components/ReportValidation';
import { Orders } from './components/Orders'; 
import { Inventory } from './components/Inventory';
import { Settings } from './components/Settings'; 
import { LayoutDashboard, Package, Menu, ClipboardList, CheckCircle, ShoppingBag, Settings as SettingsIcon, Lock, Mail, Key, LogOut } from 'lucide-react';

enum View { DASHBOARD, VOLUNTEER_REPORT, ORDERS, VALIDATION, INVENTORY, SETTINGS }

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS as any);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [orders, setOrders] = useState<OrderSheet[]>([]); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de Segurança
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Configurações
  const [availableVolunteers, setAvailableVolunteers] = useState<string[]>(['Eloá Batista', 'Thiago Rodrigues']);
  const [availableServices, setAvailableServices] = useState<string[]>(['Culto da Família', 'Culto Profético', 'Arena', 'Culto de Fé e Milagres']);
  
  const [admins, setAdmins] = useState<AdminUser[]>([
    { id: '1', name: 'Admin', email: 'admin@sara.com', password: '123' } 
  ]);

  // ... (Funções de add/remove e lógica de negócios mantidas iguais, omitidas para brevidade, mas devem estar aqui) ...
  // [MANTENHA TODAS AS SUAS FUNÇÕES addVolunteer, handleReportSubmit, handleValidateReport AQUI COMO ANTES]
  // Vou reimplementar as funções básicas de estado para o código rodar:
  const addVolunteer = (name: string) => setAvailableVolunteers(prev => [...prev, name]);
  const removeVolunteer = (name: string) => setAvailableVolunteers(prev => prev.filter(v => v !== name));
  const addService = (service: string) => setAvailableServices(prev => [...prev, service]);
  const removeService = (service: string) => setAvailableServices(prev => prev.filter(s => s !== service));
  const addAdmin = (newAdmin: Omit<AdminUser, 'id'>) => setAdmins(prev => [...prev, { ...newAdmin, id: Date.now().toString() }]);
  const removeAdmin = (id: string) => setAdmins(prev => prev.filter(a => a.id !== id));
  
  const handleReportSubmit = (newReportData: Omit<DailyReport, 'id' | 'status'>) => { setReports(prev => [{ ...newReportData, id: `rep-${Date.now()}`, status: 'PENDENTE' }, ...prev]); };
  const handleOrderSubmit = (newOrderData: Omit<OrderSheet, 'id' | 'status'>) => { setOrders(prev => [{ ...newOrderData, id: `ord-${Date.now()}`, status: 'PENDENTE' }, ...prev]); };
  const handleToggleReportItem = (reportId: string, itemIndex: number) => { setReports(prev => prev.map(r => r.id === reportId ? { ...r, items: r.items.map((it, idx) => idx === itemIndex ? { ...it, checked: !it.checked } : it) } : r)); };
  const handleToggleOrderItem = (orderId: string, itemIndex: number) => { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: o.items.map((it, idx) => idx === itemIndex ? { ...it, checked: !it.checked } : it) } : o)); };
  const handleValidateReport = (reportId: string, adminName: string) => { setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'VALIDADO', validatedBy: adminName } : r)); };
  const handleUnvalidateReport = (reportId: string) => { setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'PENDENTE', validatedBy: undefined } : r)); };
  const handleValidateOrder = (orderId: string, adminName: string) => { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ENTREGUE', validatedBy: adminName } : o)); };
  const handleUnvalidateOrder = (orderId: string) => { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PENDENTE', validatedBy: undefined } : o)); };
  const handleUpdateProduct = (updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  const handleAddProduct = (newProduct: Product) => setProducts(prev => [...prev, newProduct]);
  const handleDeleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

  const handleDashboardLogin = () => {
    const admin = admins.find(a => a.email === loginEmail && a.password === loginPass);
    if (admin) { setIsDashboardUnlocked(true); setLoginEmail(''); setLoginPass(''); } else { alert("🚫 Acesso Negado!"); }
  };
  const handleLockDashboard = () => setIsDashboardUnlocked(false);

  const NavItem = ({ view, icon: Icon, label, badge }: any) => (
    <button
      onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-bold uppercase tracking-wide text-xs ${
        currentView === view 
          ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-green-400'
      }`}
    >
      <div className="relative">
        <Icon size={20} />
        {badge && badge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}
      </div>
      <span>{label}</span>
    </button>
  );

  const pendingCount = reports.filter(r => r.status === 'PENDENTE').length + orders.filter(o => o.status === 'PENDENTE').length;

  return (
    <div className="min-h-screen bg-black flex font-sans text-zinc-100">
      
   {/* SIDEBAR DARK - Atualizada */}
      <aside className="hidden lg:flex flex-col w-72 bg-zinc-900 border-r border-zinc-800 p-6 fixed h-full z-10">
        <div className="flex flex-col items-center mb-6 w-full">
            {/* ÁREA DA LOGO */}
            {/* Removi a borda CSS e o rounded-full para não cortar sua logo quadrada */}
            <div className="w-56 h-56 flex items-center justify-center relative">
                 {/* Efeito de brilho verde atrás da logo */}
                 <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full opacity-50"></div>
                 
                 {/* A imagem em si */}
                 <img 
                    src="/logo.png" 
                    alt="Sara Store" 
                    className="w-full h-full object-contain relative z-10 drop-shadow-2xl" 
                 />
            </div>
            
            {/* Removi os textos h1 "SARA STORE" e p "Freguesia" aqui, 
                pois eles já estão escritos dentro da imagem da sua logo */}
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel Geral" />
          <NavItem view={View.VOLUNTEER_REPORT} icon={ClipboardList} label="Relatório Voluntário" />
          <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
          <NavItem view={View.VALIDATION} icon={CheckCircle} label="Validação Pastoral" badge={pendingCount} />
          <div className="my-4 border-t border-zinc-800"></div>
          <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          <div className="mt-auto pt-4"><NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" /></div>
        </nav>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 w-full bg-zinc-900 z-20 border-b border-zinc-800 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-10 h-10 rounded-full border border-green-500" />
            <span className="font-bold text-lg text-green-500 tracking-widest">SARA STORE</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400"><Menu size={24} /></button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-zinc-900 w-3/4 h-full p-6 border-r border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="mb-8 text-center">
                <img src="/logo.png" className="w-20 h-20 mx-auto rounded-full border border-green-500 mb-2" />
                <h2 className="text-green-500 font-bold tracking-widest">SARA STORE</h2>
            </div>
            <nav className="space-y-2">
              <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel" />
              <NavItem view={View.VOLUNTEER_REPORT} icon={ClipboardList} label="Relatório" />
              <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
              <NavItem view={View.VALIDATION} icon={CheckCircle} label="Validação" badge={pendingCount} />
              <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
              <div className="border-t border-zinc-800 my-2 pt-2"><NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" /></div>
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-24 lg:pt-8 transition-all bg-black min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* DASHBOARD LOGIN (DARK THEME) */}
          {currentView === View.DASHBOARD && (
            !isDashboardUnlocked ? (
                <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in">
                    <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-zinc-800 w-full max-w-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-700"></div>
                        <div className="bg-zinc-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            <Lock size={36} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-wide uppercase">Acesso Restrito</h2>
                        <p className="text-xs text-zinc-500 mb-8 uppercase tracking-widest">Gestão Financeira Sara Store</p>
                        
                        <div className="space-y-4 text-left">
                            <div className="group">
                                <label className="text-[10px] font-bold text-green-500 uppercase ml-1 mb-1 block">E-mail</label>
                                <div className="flex items-center gap-3 bg-black border border-zinc-700 rounded-xl px-4 py-3 group-focus-within:border-green-500 transition-colors">
                                    <Mail size={18} className="text-zinc-500"/>
                                    <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-transparent w-full outline-none text-sm text-white placeholder-zinc-700" placeholder="admin@sara.com" />
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-green-500 uppercase ml-1 mb-1 block">Senha</label>
                                <div className="flex items-center gap-3 bg-black border border-zinc-700 rounded-xl px-4 py-3 group-focus-within:border-green-500 transition-colors">
                                    <Key size={18} className="text-zinc-500"/>
                                    <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDashboardLogin()} className="bg-transparent w-full outline-none text-sm text-white placeholder-zinc-700" placeholder="••••••" />
                                </div>
                            </div>
                            <button onClick={handleDashboardLogin} className="w-full bg-green-600 text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] mt-4">
                                Desbloquear
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <button 
                        onClick={handleLockDashboard}
                        className="absolute top-0 right-0 z-10 bg-zinc-900 border border-zinc-700 text-zinc-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-900/30 hover:text-red-500 flex items-center gap-2 transition-all"
                    >
                        <LogOut size={14} /> Bloquear
                    </button>
                    {/* Passando estilos dark para o dashboard se necessário, mas o layout global já cuida do fundo */}
                    <Dashboard transactions={transactions} products={products} />
                </div>
            )
          )}

          {/* Renderização das outras views (Manter lógica, mas o CSS global já afeta) */}
          {currentView === View.VOLUNTEER_REPORT && <VolunteerSales products={products} onSubmitReport={handleReportSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />}
          {currentView === View.ORDERS && <Orders products={products} onSubmitOrders={handleOrderSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />}
          {currentView === View.VALIDATION && <ReportValidation reports={reports} orders={orders} admins={admins} onValidateReport={handleValidateReport} onValidateOrder={handleValidateOrder} onUnvalidateReport={handleUnvalidateReport} onUnvalidateOrder={handleUnvalidateOrder} onToggleReportItem={handleToggleReportItem} onToggleOrderItem={handleToggleOrderItem} />}
          {currentView === View.INVENTORY && <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />}
          {currentView === View.SETTINGS && <Settings volunteers={availableVolunteers} services={availableServices} admins={admins} onAddVolunteer={addVolunteer} onRemoveVolunteer={removeVolunteer} onAddService={addService} onRemoveService={removeService} onAddAdmin={addAdmin} onRemoveAdmin={removeAdmin} />}
        </div>
      </main>
    </div>
  );
};

export default App;
