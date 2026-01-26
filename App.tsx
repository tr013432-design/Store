import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, DailyReport, OrderSheet, AdminUser, Customer, Category, Expense } from './types';
import { Dashboard } from './components/Dashboard';
import { VolunteerSales } from './components/VolunteerSales'; 
import { ReportValidation } from './components/ReportValidation';
import { Orders } from './components/Orders'; 
import { Inventory } from './components/Inventory';
import { Settings } from './components/Settings'; 
import { Deliveries } from './components/Deliveries';
import { Loyalty } from './components/Loyalty';
import { Customers } from './components/Customers';
import { Expenses } from './components/Expenses';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LayoutDashboard, Package, Menu, ClipboardList, CheckCircle, ShoppingBag, Settings as SettingsIcon, Lock, Mail, Key, LogOut, Truck, Star, Users, TrendingDown, Store, ChevronRight } from 'lucide-react';

enum View { DASHBOARD, VOLUNTEER_REPORT, ORDERS, VALIDATION, INVENTORY, SETTINGS, DELIVERIES, LOYALTY, CUSTOMERS, EXPENSES }

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // --- ESTADOS DE DADOS ---
  const [products, setProducts] = useLocalStorage<Product[]>('db_products', MOCK_PRODUCTS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('db_transactions', MOCK_TRANSACTIONS as any);
  const [reports, setReports] = useLocalStorage<DailyReport[]>('db_reports', []);
  const [orders, setOrders] = useLocalStorage<OrderSheet[]>('db_orders', []); 
  const [customers, setCustomers] = useLocalStorage<Customer[]>('db_customers', []); 
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('db_expenses', []); 

  // --- CONFIGURAÇÕES ---
  const [pointsConfig, setPointsConfig] = useLocalStorage<Record<string, number>>('cfg_points_rules', {
      'Livros e Bíblias': 15, 'Vestuário': 30, 'Papelaria': 5, 'Acessórios': 5, 'Outros': 1
  });
  const [pointsValue, setPointsValue] = useLocalStorage<number>('cfg_points_value', 0.10);
  const [availableVolunteers, setAvailableVolunteers] = useLocalStorage<string[]>('cfg_volunteers', ['Eloá Batista', 'Thiago Rodrigues']);
  const [availableServices, setAvailableServices] = useLocalStorage<string[]>('cfg_services', ['Culto da Família', 'Culto Profético', 'Arena', 'Culto de Fé e Milagres']);
  const [admins, setAdmins] = useLocalStorage<AdminUser[]>('cfg_admins', [{ id: '1', name: 'Admin', email: 'admin@sara.com', password: '123' }]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoadingLogin, setIsLoadingLogin] = useState(false); // Estado para efeito visual

  // --- HELPERS (Lógica de Negócios) ---
  const addVolunteer = (name: string) => setAvailableVolunteers(prev => [...prev, name]);
  const removeVolunteer = (name: string) => setAvailableVolunteers(prev => prev.filter(v => v !== name));
  const addService = (service: string) => setAvailableServices(prev => [...prev, service]);
  const removeService = (service: string) => setAvailableServices(prev => prev.filter(s => s !== service));
  const addAdmin = (newAdmin: Omit<AdminUser, 'id'>) => setAdmins(prev => [...prev, { ...newAdmin, id: Date.now().toString() }]);
  const removeAdmin = (id: string) => setAdmins(prev => prev.filter(a => a.id !== id));
  const handleAddExpense = (newExp: Expense) => setExpenses(prev => [newExp, ...prev]);
  const handleDeleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  // --- LOGIN ---
  const handleDashboardLogin = () => {
    setIsLoadingLogin(true);
    setTimeout(() => { // Simula delay para UX
        const admin = admins.find(a => a.email === loginEmail && a.password === loginPass);
        if (admin) { 
            setIsDashboardUnlocked(true); 
            setLoginEmail(''); 
            setLoginPass(''); 
        } else { 
            alert("🚫 Acesso Negado!"); 
        }
        setIsLoadingLogin(false);
    }, 800);
  };
  const handleLockDashboard = () => setIsDashboardUnlocked(false);

  // --- HANDLERS (Mantidos iguais para funcionalidade) ---
  const handleReportSubmit = (d: any) => setReports(p => [{ ...d, id: `rep-${Date.now()}`, status: 'PENDENTE' }, ...p]);
  const handleOrderSubmit = (d: any) => setOrders(p => [{ ...d, id: `ord-${Date.now()}`, status: 'PENDENTE' }, ...p]);
  const handleToggleReportItem = (id: string, idx: number) => setReports(p => p.map(r => r.id === id ? { ...r, items: r.items.map((i, x) => x === idx ? { ...i, checked: !i.checked } : i) } : r));
  const handleToggleOrderItem = (id: string, idx: number) => setOrders(p => p.map(o => o.id === id ? { ...o, items: o.items.map((i, x) => x === idx ? { ...i, checked: !i.checked } : i) } : o));
  
  const handleValidateReport = (id: string, admin: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'VALIDADO', validatedBy: admin } : r));
    const rep = reports.find(r => r.id === id);
    if (rep) {
        const items = rep.items.filter(i => i.paymentMethod !== 'Sara Points');
        if (items.length > 0) setTransactions(prev => [{ id: `tx-rep-${id}`, date: rep.date, items: items.map(i => ({ ...i, id: i.productName, name: i.productName, price: i.total/i.quantity, category: 'Outros' as any, stock: 0 })), total: items.reduce((a,b)=>a+b.total,0), paymentMethod: 'Dinheiro', volunteerName: rep.volunteerName, serviceType: rep.serviceType }, ...prev]);
        setProducts(prev => prev.map(p => { const sold = rep.items.find(i => i.productName === p.name); return sold ? { ...p, stock: p.stock - sold.quantity } : p; }));
        // Lógica de pontos (simplificada)
        setCustomers(prevCustomers => {
            let updated = [...prevCustomers];
            rep.items.forEach(item => { if (item.customerPhone) { /* Lógica de pontos aqui */ } });
            return updated;
        });
    }
  };

  const handleValidateOrder = (id: string, admin: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ENTREGUE', validatedBy: admin } : o));
    const order = orders.find(o => o.id === id);
    if (order) {
        setTransactions(prev => [{ id: `tx-ord-${id}`, date: order.date, items: order.items.map(i => ({ ...i, id: i.productName, name: i.productName, price: i.total/i.quantity, category: 'Outros' as any, stock: 0 })), total: order.grandTotal, paymentMethod: 'Dinheiro', volunteerName: order.volunteerName, serviceType: order.serviceType }, ...prev]);
        // Lógica de pontos (simplificada)
    }
    alert("Encomenda validada!");
  };

  const handleUnvalidateReport = (id: string) => { setReports(p => p.map(r => r.id === id ? { ...r, status: 'PENDENTE', validatedBy: undefined } : r)); setTransactions(p => p.filter(t => t.id !== `tx-rep-${id}`)); const rep = reports.find(r => r.id === id); if (rep) setProducts(p => p.map(prod => { const sold = rep.items.find(i => i.productName === prod.name); return sold ? { ...prod, stock: prod.stock + sold.quantity } : prod; })); };
  const handleUnvalidateOrder = (id: string) => { setOrders(p => p.map(o => o.id === id ? { ...o, status: 'PENDENTE', validatedBy: undefined } : o)); setTransactions(p => p.filter(t => t.id !== `tx-ord-${id}`)); };
  const handleMarkItemDelivered = (oid: string, iid: string) => { setOrders(p => p.map(o => o.id === oid ? { ...o, items: o.items.map(i => i.id === iid ? { ...i, delivered: true } : i) } : o)); };
  
  const handleSaveCustomer = (c: Customer) => setCustomers(p => { const ex = p.find(x => x.id === c.id); return ex ? p.map(x => x.id === c.id ? { ...x, ...c, points: x.points, totalSpent: x.totalSpent, history: x.history } : x) : [...p, c]; });
  const handleDeleteCustomer = (id: string) => setCustomers(p => p.filter(x => x.id !== id));
  const handleUpdateProduct = (prod: Product) => setProducts(p => p.map(x => x.id === prod.id ? prod : x));
  const handleAddProduct = (prod: Product) => setProducts(p => [...p, prod]);
  const handleDeleteProduct = (id: string) => setProducts(p => p.filter(x => x.id !== id));
  const handleManualAddPoints = (ph: string, pts: number) => setCustomers(p => p.map(c => c.id === ph ? { ...c, points: c.points + pts } : c));
  const handleRedeemReward = (ph: string, cost: number) => setCustomers(p => p.map(c => c.id === ph ? { ...c, points: c.points - cost, history: [...c.history, { date: new Date().toISOString(), description: "Resgate", value: 0, pointsEarned: -cost }] } : c));

  const pendingCount = reports.filter(r => r.status === 'PENDENTE').length + orders.filter(o => o.status === 'PENDENTE').length;
  const pendingDeliveries = orders.filter(o => o.status === 'ENTREGUE').flatMap(o => o.items).filter(i => !i.delivered).length;

  // --- SIDEBAR MODERNA ---
  const SidebarContent = () => (
    <div className="space-y-8 mt-4">
       {/* BLOCO 1: OPERACIONAL */}
       <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-4">Operacional</p>
          <div className="space-y-1">
            <NavItem view={View.VOLUNTEER_REPORT} icon={Store} label="Venda Balcão" />
            <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
            <NavItem view={View.CUSTOMERS} icon={Users} label="Clientes" />
            <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          </div>
       </div>

       {/* BLOCO 2: GESTÃO */}
       <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-4">Gestão</p>
          <div className="space-y-1">
            <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={View.VALIDATION} icon={CheckCircle} label="Validações" badge={pendingCount} />
            <NavItem view={View.EXPENSES} icon={TrendingDown} label="Saídas / Despesas" />
            <NavItem view={View.DELIVERIES} icon={Truck} label="Logística" badge={pendingDeliveries} />
            <NavItem view={View.LOYALTY} icon={Star} label="Fidelidade" />
          </div>
       </div>

       {/* BLOCO 3: SISTEMA */}
       <div className="pt-4 border-t border-zinc-900/50">
          <NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" />
       </div>
    </div>
  );

  const NavItem = ({ view, icon: Icon, label, badge }: any) => {
    const active = currentView === view;
    return (
        <button 
            onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }} 
            className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm mx-1
                ${active 
                    ? 'bg-gradient-to-r from-zinc-900 to-transparent text-white border-l-2 border-green-500' 
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={`transition-colors ${active ? 'text-green-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                <span>{label}</span>
            </div>
            {badge > 0 && <span className="bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">{badge}</span>}
            {active && <ChevronRight size={14} className="text-zinc-700" />}
        </button>
    );
  };

  return (
    // Fundo "Cinematográfico" com gradiente radial e cor base escura
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 font-sans selection:bg-green-500/30 selection:text-green-200">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 bg-black/40 border-r border-white/5 p-4 fixed h-full z-20 backdrop-blur-xl">
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-8 pt-6 relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full pointer-events-none"></div>
             <img src="/logo.png" alt="Sara Store" className="w-28 h-28 object-contain drop-shadow-2xl relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
             <div className="mt-4 text-center">
                 <h1 className="text-xs font-bold tracking-[0.3em] text-white uppercase opacity-80">Gestão Freguesia</h1>
             </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <SidebarContent />
        </div>

        <div className="p-4 mt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center text-xs font-bold shadow-lg shadow-green-500/20">A</div>
                <div>
                    <p className="text-xs font-bold text-white">Admin</p>
                    <p className="text-[10px] text-zinc-500">Logado</p>
                </div>
            </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 w-full bg-black/80 backdrop-blur-md z-30 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3"><img src="/logo.png" className="w-8 h-8" alt="Logo" /><span className="font-bold text-sm tracking-widest text-white">SARA<span className="text-green-500">STORE</span></span></div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400"><Menu size={24} /></button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-zinc-950 w-3/4 h-full p-6 border-r border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-8"><img src="/logo.png" alt="Sara Store" className="w-20 h-20 object-contain mb-4" /></div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-10 pt-24 lg:pt-10 transition-all min-h-screen relative">
        <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
          
          {currentView === View.DASHBOARD && (
            !isDashboardUnlocked ? (
                // --- TELA DE LOGIN "LUXO" ---
                <div className="flex flex-col items-center justify-center h-[85vh]">
                    {/* Glow Effect behind card */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-green-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                    
                    <div className="relative bg-zinc-900/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden group">
                        {/* Top Gradient Line */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                                <Lock size={20} className="text-green-500"/>
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Acesso Restrito</h2>
                            <p className="text-xs text-zinc-500 font-medium">Área exclusiva para Liderança</p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">E-mail Corporativo</label>
                                <div className="relative group/input">
                                    <Mail size={16} className="absolute left-4 top-3.5 text-zinc-500 group-focus-within/input:text-green-500 transition-colors" />
                                    <input 
                                        value={loginEmail} 
                                        onChange={e => setLoginEmail(e.target.value)} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all" 
                                        placeholder="admin@sara.com" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Senha de Acesso</label>
                                <div className="relative group/input">
                                    <Key size={16} className="absolute left-4 top-3.5 text-zinc-500 group-focus-within/input:text-green-500 transition-colors" />
                                    <input 
                                        type="password" 
                                        value={loginPass} 
                                        onChange={e => setLoginPass(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && handleDashboardLogin()} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all" 
                                        placeholder="••••••" 
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleDashboardLogin} 
                                disabled={isLoadingLogin}
                                className="w-full bg-gradient-to-br from-green-600 to-green-700 text-white py-3.5 rounded-xl font-bold text-sm hover:from-green-500 hover:to-green-600 transition-all shadow-lg shadow-green-900/20 transform active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                            >
                                {isLoadingLogin ? <span className="animate-pulse">Autenticando...</span> : "Acessar Painel"}
                            </button>
                        </div>
                    </div>
                    
                    <p className="mt-8 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Rodrigues Growth Partners © 2026</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute top-0 right-0 z-10">
                        <button onClick={handleLockDashboard} className="bg-black/40 backdrop-blur text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/5 transition-all">
                            <LogOut size={14} /> Bloquear
                        </button>
                    </div>
                    <Dashboard transactions={transactions} products={products} expenses={expenses} />
                </div>
            )
          )}

          {currentView === View.VOLUNTEER_REPORT && <VolunteerSales products={products} onSubmitReport={handleReportSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} customers={customers} pointsValue={pointsValue} />}
          {currentView === View.ORDERS && <Orders products={products} onSubmitOrders={handleOrderSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />}
          {currentView === View.VALIDATION && <ReportValidation reports={reports} orders={orders} admins={admins} onValidateReport={handleValidateReport} onValidateOrder={handleValidateOrder} onUnvalidateReport={handleUnvalidateReport} onUnvalidateOrder={handleUnvalidateOrder} onToggleReportItem={handleToggleReportItem} onToggleOrderItem={handleToggleOrderItem} />}
          {currentView === View.DELIVERIES && <Deliveries orders={orders} onMarkDelivered={handleMarkItemDelivered} />}
          {currentView === View.CUSTOMERS && <Customers customers={customers} onSaveCustomer={handleSaveCustomer} onDeleteCustomer={handleDeleteCustomer} />}
          {currentView === View.LOYALTY && <Loyalty customers={customers} pointsConfig={pointsConfig} onUpdatePointsConfig={setPointsConfig} onManualAddPoints={handleManualAddPoints} onRedeemReward={handleRedeemReward} />}
          {currentView === View.INVENTORY && <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />}
          {currentView === View.EXPENSES && <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} currentUser="Admin" />}
          {currentView === View.SETTINGS && <Settings volunteers={availableVolunteers} services={availableServices} admins={admins} pointsConfig={pointsConfig} pointsValue={pointsValue} onUpdatePointsConfig={setPointsConfig} onUpdatePointsValue={setPointsValue} onAddVolunteer={addVolunteer} onRemoveVolunteer={removeVolunteer} onAddService={addService} onRemoveService={removeService} onAddAdmin={addAdmin} onRemoveAdmin={removeAdmin} />}
        </div>
      </main>
    </div>
  );
};

export default App;
