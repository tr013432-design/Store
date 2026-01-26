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
import { LayoutDashboard, Package, Menu, ClipboardList, CheckCircle, ShoppingBag, Settings as SettingsIcon, Lock, Mail, Key, LogOut, Truck, Star, Users, TrendingDown, Store } from 'lucide-react';

enum View { DASHBOARD, VOLUNTEER_REPORT, ORDERS, VALIDATION, INVENTORY, SETTINGS, DELIVERIES, LOYALTY, CUSTOMERS, EXPENSES }

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  const [products, setProducts] = useLocalStorage<Product[]>('db_products', MOCK_PRODUCTS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('db_transactions', MOCK_TRANSACTIONS as any);
  const [reports, setReports] = useLocalStorage<DailyReport[]>('db_reports', []);
  const [orders, setOrders] = useLocalStorage<OrderSheet[]>('db_orders', []); 
  const [customers, setCustomers] = useLocalStorage<Customer[]>('db_customers', []); 
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('db_expenses', []); 

  // Configurações
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

  // --- Helpers ---
  const addVolunteer = (name: string) => setAvailableVolunteers(prev => [...prev, name]);
  const removeVolunteer = (name: string) => setAvailableVolunteers(prev => prev.filter(v => v !== name));
  const addService = (service: string) => setAvailableServices(prev => [...prev, service]);
  const removeService = (service: string) => setAvailableServices(prev => prev.filter(s => s !== service));
  const addAdmin = (newAdmin: Omit<AdminUser, 'id'>) => setAdmins(prev => [...prev, { ...newAdmin, id: Date.now().toString() }]);
  const removeAdmin = (id: string) => setAdmins(prev => prev.filter(a => a.id !== id));
  const handleAddExpense = (newExp: Expense) => setExpenses(prev => [newExp, ...prev]);
  const handleDeleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  // --- Lógica de Login/Bloqueio ---
  const handleDashboardLogin = () => {
    const admin = admins.find(a => a.email === loginEmail && a.password === loginPass);
    if (admin) { setIsDashboardUnlocked(true); setLoginEmail(''); setLoginPass(''); } else { alert("🚫 Acesso Negado!"); }
  };
  const handleLockDashboard = () => setIsDashboardUnlocked(false);

  // --- Lógica de Negócios ---
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
        
        setCustomers(prevCustomers => {
            let updatedCustomers = [...prevCustomers];
            rep.items.forEach(item => {
                if (item.customerPhone) {
                    const phone = item.customerPhone.replace(/\D/g, '');
                    const existingIndex = updatedCustomers.findIndex(c => c.id === phone);
                    const originalProduct = products.find(p => p.name === item.productName);
                    const category = originalProduct?.category || 'Outros';
                    const config = pointsConfig || {};
                    const pointsPerUnit = config[category] !== undefined ? config[category] : 1;
                    const pointsChange = item.paymentMethod === 'Sara Points' ? -Math.floor(item.total) : (item.quantity * pointsPerUnit);
                    const description = item.paymentMethod === 'Sara Points' ? `Resgate: ${item.productName}` : `Compra: ${item.productName}`;

                    if (existingIndex >= 0) {
                        const current = updatedCustomers[existingIndex];
                        updatedCustomers[existingIndex] = { ...current, points: current.points + pointsChange, totalSpent: item.paymentMethod !== 'Sara Points' ? current.totalSpent + item.total : current.totalSpent, lastPurchase: new Date().toISOString(), history: [...current.history, { date: new Date().toISOString(), description, value: item.total, pointsEarned: pointsChange }] };
                    } else if (pointsChange > 0) {
                        updatedCustomers.push({ id: phone, name: `Cliente ${phone.slice(-4)}`, phone: item.customerPhone, points: pointsChange, totalSpent: item.total, lastPurchase: new Date().toISOString(), history: [{ date: new Date().toISOString(), description, value: item.total, pointsEarned: pointsChange }] });
                    }
                }
            });
            return updatedCustomers;
        });
    }
  };

  const handleValidateOrder = (id: string, admin: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ENTREGUE', validatedBy: admin } : o));
    const order = orders.find(o => o.id === id);
    if (order) {
        setTransactions(prev => [{ id: `tx-ord-${id}`, date: order.date, items: order.items.map(i => ({ ...i, id: i.productName, name: i.productName, price: i.total/i.quantity, category: 'Outros' as any, stock: 0 })), total: order.grandTotal, paymentMethod: 'Dinheiro', volunteerName: order.volunteerName, serviceType: order.serviceType }, ...prev]);
        setCustomers(prevCustomers => {
            let updatedCustomers = [...prevCustomers];
            order.items.forEach(item => {
                const phone = item.customerPhone.replace(/\D/g, '');
                const originalProduct = products.find(p => p.name === item.productName);
                const category = originalProduct?.category || 'Outros';
                const config = pointsConfig || {};
                const pointsPerUnit = config[category] !== undefined ? config[category] : 1;
                const pointsEarned = item.quantity * pointsPerUnit;
                const existingIndex = updatedCustomers.findIndex(c => c.id === phone);

                if (existingIndex >= 0) {
                    const current = updatedCustomers[existingIndex];
                    updatedCustomers[existingIndex] = { ...current, points: current.points + pointsEarned, totalSpent: current.totalSpent + item.total, lastPurchase: new Date().toISOString(), history: [...current.history, { date: new Date().toISOString(), description: `Compra: ${item.productName}`, value: item.total, pointsEarned }] };
                } else {
                    updatedCustomers.push({ id: phone, name: item.customerName, phone: item.customerPhone, points: pointsEarned, totalSpent: item.total, lastPurchase: new Date().toISOString(), history: [{ date: new Date().toISOString(), description: `Primeira Compra: ${item.productName}`, value: item.total, pointsEarned }] });
                }
            });
            return updatedCustomers;
        });
    }
    alert("Encomenda validada!");
  };

  const handleUnvalidateReport = (id: string) => { setReports(p => p.map(r => r.id === id ? { ...r, status: 'PENDENTE', validatedBy: undefined } : r)); setTransactions(p => p.filter(t => t.id !== `tx-rep-${id}`)); const rep = reports.find(r => r.id === id); if (rep) setProducts(p => p.map(prod => { const sold = rep.items.find(i => i.productName === prod.name); return sold ? { ...prod, stock: prod.stock + sold.quantity } : prod; })); };
  const handleUnvalidateOrder = (id: string) => { setOrders(p => p.map(o => o.id === id ? { ...o, status: 'PENDENTE', validatedBy: undefined } : o)); setTransactions(p => p.filter(t => t.id !== `tx-ord-${id}`)); };
  const handleMarkItemDelivered = (oid: string, iid: string) => { setOrders(p => p.map(o => o.id === oid ? { ...o, items: o.items.map(i => i.id === iid ? { ...i, delivered: true } : i) } : o)); };
  
  // Funções de CRUD
  const handleSaveCustomer = (c: Customer) => setCustomers(p => { const ex = p.find(x => x.id === c.id); return ex ? p.map(x => x.id === c.id ? { ...x, ...c, points: x.points, totalSpent: x.totalSpent, history: x.history } : x) : [...p, c]; });
  const handleDeleteCustomer = (id: string) => setCustomers(p => p.filter(x => x.id !== id));
  const handleUpdateProduct = (prod: Product) => setProducts(p => p.map(x => x.id === prod.id ? prod : x));
  const handleAddProduct = (prod: Product) => setProducts(p => [...p, prod]);
  const handleDeleteProduct = (id: string) => setProducts(p => p.filter(x => x.id !== id));
  
  // Funções de Pontos
  const handleManualAddPoints = (ph: string, pts: number) => setCustomers(p => p.map(c => c.id === ph ? { ...c, points: c.points + pts } : c));
  const handleRedeemReward = (ph: string, cost: number) => setCustomers(p => p.map(c => c.id === ph ? { ...c, points: c.points - cost, history: [...c.history, { date: new Date().toISOString(), description: "Resgate", value: 0, pointsEarned: -cost }] } : c));

  const pendingCount = reports.filter(r => r.status === 'PENDENTE').length + orders.filter(o => o.status === 'PENDENTE').length;
  const pendingDeliveries = orders.filter(o => o.status === 'ENTREGUE').flatMap(o => o.items).filter(i => !i.delivered).length;

  // --- NOVO COMPONENTE DE MENU LATERAL ---
  const SidebarContent = () => (
    <div className="space-y-6">
       {/* BLOCO 1: OPERACIONAL (Voluntários) */}
       <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-3">Operacional</p>
          <div className="space-y-1">
            <NavItem view={View.VOLUNTEER_REPORT} icon={Store} label="Venda Balcão" />
            <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
            <NavItem view={View.CUSTOMERS} icon={Users} label="Clientes" />
            <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          </div>
       </div>

       {/* BLOCO 2: GESTÃO & FINANCEIRO (Adm) */}
       <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-3">Gestão</p>
          <div className="space-y-1">
            <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={View.VALIDATION} icon={CheckCircle} label="Validações" badge={pendingCount} />
            <NavItem view={View.EXPENSES} icon={TrendingDown} label="Saídas / Despesas" />
            <NavItem view={View.DELIVERIES} icon={Truck} label="Logística" badge={pendingDeliveries} />
            <NavItem view={View.LOYALTY} icon={Star} label="Fidelidade" />
          </div>
       </div>

       {/* BLOCO 3: SISTEMA */}
       <div className="pt-4 border-t border-zinc-800">
          <NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" />
       </div>
    </div>
  );

  const NavItem = ({ view, icon: Icon, label, badge }: any) => (
    <button onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-xs ${currentView === view ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}>
      <div className="relative"><Icon size={18} />{badge && badge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{badge}</span>}</div><span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black flex font-sans text-zinc-100">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-zinc-900 p-4 fixed h-full z-10">
        
        {/* --- LOGO ORIGINAL RESTAURADA AQUI --- */}
        <div className="flex flex-col items-center mb-6 w-full animate-fade-in">
            <img src="/logo.png" alt="Sara Store" className="w-28 h-28 object-contain drop-shadow-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        {/* ---------------------------------- */}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <SidebarContent />
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 w-full bg-zinc-950 z-20 border-b border-zinc-900 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3"><img src="/logo.png" className="w-8 h-8" alt="Logo" /><span className="font-bold text-sm tracking-widest text-white">SARA<span className="text-green-600">STORE</span></span></div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400"><Menu size={24} /></button>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-zinc-950 w-3/4 h-full p-6 border-r border-zinc-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-6 w-full"><img src="/logo.png" alt="Sara Store" className="w-20 h-20 object-contain mb-2" /></div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-24 lg:pt-8 transition-all bg-black min-h-screen">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {currentView === View.DASHBOARD && (
            !isDashboardUnlocked ? (
                <div className="flex flex-col items-center justify-center h-[80vh]">
                    <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-zinc-800 w-full max-w-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-700"></div>
                        <div className="bg-zinc-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800"><Lock size={24} className="text-zinc-500"/></div>
                        <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
                        <p className="text-xs text-zinc-500 mb-6">Área exclusiva para Liderança</p>
                        <div className="space-y-3">
                            <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition-colors" placeholder="E-mail" />
                            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDashboardLogin()} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition-colors" placeholder="Senha" />
                            <button onClick={handleDashboardLogin} className="w-full bg-green-600 text-black py-3 rounded-lg font-bold text-sm hover:bg-green-500 transition-all mt-2">Acessar Painel</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute top-0 right-0 z-10"><button onClick={handleLockDashboard} className="bg-zinc-900 text-zinc-500 hover:text-red-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-zinc-800"><LogOut size={12} /> Bloquear</button></div>
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
