import React, { useState, useEffect } from 'react';
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
import { LayoutDashboard, Package, Menu, ClipboardList, CheckCircle, ShoppingBag, Settings as SettingsIcon, Lock, Mail, Key, LogOut, Truck, Star, Users, TrendingDown, Store, ChevronRight, MapPin, ArrowLeft, Plus, X, Trash2 } from 'lucide-react';

// --- TIPOS DA REGIONAL ---
interface RegionalUnit {
    id: string;
    name: string;
    color: string;
    password: string; // Senha para acessar a unidade
}

enum View { DASHBOARD, VOLUNTEER_REPORT, ORDERS, VALIDATION, INVENTORY, SETTINGS, DELIVERIES, LOYALTY, CUSTOMERS, EXPENSES }

// --- COMPONENTE DO SISTEMA (ISOLADO POR UNIDADE) ---
const StoreSystem: React.FC<{ unitId: string, unitName: string, onLogoutUnit: () => void }> = ({ unitId, unitName, onLogoutUnit }) => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // O prefixo `unitId` separa os dados de cada igreja
  const [products, setProducts] = useLocalStorage<Product[]>(`${unitId}_db_products`, MOCK_PRODUCTS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(`${unitId}_db_transactions`, MOCK_TRANSACTIONS as any);
  const [reports, setReports] = useLocalStorage<DailyReport[]>(`${unitId}_db_reports`, []);
  const [orders, setOrders] = useLocalStorage<OrderSheet[]>(`${unitId}_db_orders`, []); 
  const [customers, setCustomers] = useLocalStorage<Customer[]>(`${unitId}_db_customers`, []); 
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(`${unitId}_db_expenses`, []); 

  // Configurações
  const [pointsConfig, setPointsConfig] = useLocalStorage<Record<string, number>>(`${unitId}_cfg_points_rules`, {
      'Livros e Bíblias': 15, 'Vestuário': 30, 'Papelaria': 5, 'Acessórios': 5, 'Outros': 1
  });
  const [pointsValue, setPointsValue] = useLocalStorage<number>(`${unitId}_cfg_points_value`, 0.10);
  const [availableVolunteers, setAvailableVolunteers] = useLocalStorage<string[]>(`${unitId}_cfg_volunteers`, ['Voluntário 1', 'Voluntário 2']);
  const [availableServices, setAvailableServices] = useLocalStorage<string[]>(`${unitId}_cfg_services`, ['Culto da Família', 'Arena Jovem', 'Domingo']);
  const [admins, setAdmins] = useLocalStorage<AdminUser[]>(`${unitId}_cfg_admins`, [{ id: '1', name: 'Admin', email: `admin@${unitId}.com`, password: '123' }]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  // --- HELPERS ---
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
    setTimeout(() => { 
        const admin = admins.find(a => a.email === loginEmail && a.password === loginPass);
        if (admin) { 
            setIsDashboardUnlocked(true); 
            setLoginEmail(''); 
            setLoginPass(''); 
        } else { 
            alert(`🚫 Acesso Negado para ${unitName}!`); 
        }
        setIsLoadingLogin(false);
    }, 800);
  };
  const handleLockDashboard = () => setIsDashboardUnlocked(false);

  // --- LOGIC ---
  const handleReportSubmit = (d: any) => setReports(p => [{ ...d, id: `rep-${Date.now()}`, status: 'PENDENTE' }, ...p]);
  const handleOrderSubmit = (d: any) => setOrders(p => [{ ...d, id: `ord-${Date.now()}`, status: 'PENDENTE' }, ...p]);
  const handleToggleReportItem = (id: string, idx: number) => setReports(p => p.map(r => r.id === id ? { ...r, items: r.items.map((i, x) => x === idx ? { ...i, checked: !i.checked } : i) } : r));
  const handleToggleOrderItem = (id: string, idx: number) => setOrders(p => p.map(o => o.id === id ? { ...o, items: o.items.map((i, x) => x === idx ? { ...i, checked: !i.checked } : i) } : o));
  
  const handleValidateReport = (id: string, admin: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'VALIDADO', validatedBy: admin } : r));
    const rep = reports.find(r => r.id === id);
    if (rep) {
        const items = rep.items.filter(i => i.paymentMethod !== 'Sara Points');
        if (items.length > 0) {
            setTransactions(prev => [{ 
                id: `tx-rep-${id}`, date: rep.date, 
                items: items.map(i => ({ ...i, id: i.productName, name: i.productName, price: i.total/i.quantity, category: 'Outros' as any, stock: 0 })), 
                total: items.reduce((a,b)=>a+b.total,0), paymentMethod: 'Dinheiro', volunteerName: rep.volunteerName, serviceType: rep.serviceType 
            }, ...prev]);
        }
        setProducts(prev => prev.map(p => { 
            const sold = rep.items.find(i => i.productName === p.name); 
            return sold ? { ...p, stock: p.stock - sold.quantity } : p; 
        }));
        setCustomers(prevCustomers => {
            let updated = [...prevCustomers];
            rep.items.forEach(item => {
                if (item.customerPhone) {
                    const phone = item.customerPhone.replace(/\D/g, '');
                    const existingIndex = updated.findIndex(c => c.id === phone);
                    const originalProduct = products.find(p => p.name === item.productName);
                    const category = originalProduct?.category || 'Outros';
                    const config = pointsConfig || {};
                    const pointsPerUnit = config[category] !== undefined ? config[category] : 1;
                    const pointsChange = item.paymentMethod === 'Sara Points' ? -Math.floor(item.total / pointsValue) : (item.quantity * pointsPerUnit);

                    if (existingIndex >= 0) {
                        const current = updated[existingIndex];
                        updated[existingIndex] = { ...current, points: current.points + pointsChange, totalSpent: item.paymentMethod !== 'Sara Points' ? current.totalSpent + item.total : current.totalSpent, lastPurchase: new Date().toISOString(), history: [...current.history, { date: new Date().toISOString(), description: item.paymentMethod === 'Sara Points' ? `Resgate: ${item.productName}` : `Compra: ${item.productName}`, value: item.total, pointsEarned: pointsChange }] };
                    } else if (pointsChange > 0) {
                        updated.push({ id: phone, name: `Cliente ${phone.slice(-4)}`, phone: item.customerPhone, points: pointsChange, totalSpent: item.total, lastPurchase: new Date().toISOString(), history: [{ date: new Date().toISOString(), description: `Compra: ${item.productName}`, value: item.total, pointsEarned: pointsChange }] });
                    }
                }
            });
            return updated;
        });
    }
  };

  const handleValidateOrder = (id: string, admin: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ENTREGUE', validatedBy: admin } : o));
    const order = orders.find(o => o.id === id);
    if (order) {
        setTransactions(prev => [{ id: `tx-ord-${id}`, date: order.date, items: order.items.map(i => ({ ...i, id: i.productName, name: i.productName, price: i.total/i.quantity, category: 'Outros' as any, stock: 0 })), total: order.grandTotal, paymentMethod: 'Dinheiro', volunteerName: order.volunteerName, serviceType: order.serviceType }, ...prev]);
        setCustomers(prevCustomers => {
            let updated = [...prevCustomers];
            order.items.forEach(item => {
                const phone = item.customerPhone.replace(/\D/g, '');
                const originalProduct = products.find(p => p.name === item.productName);
                const category = originalProduct?.category || 'Outros';
                const config = pointsConfig || {};
                const pointsPerUnit = config[category] !== undefined ? config[category] : 1;
                const pointsEarned = item.quantity * pointsPerUnit;
                const existingIndex = updated.findIndex(c => c.id === phone);

                if (existingIndex >= 0) {
                    const current = updated[existingIndex];
                    updated[existingIndex] = { ...current, points: current.points + pointsEarned, totalSpent: current.totalSpent + item.total, lastPurchase: new Date().toISOString(), history: [...current.history, { date: new Date().toISOString(), description: `Compra: ${item.productName}`, value: item.total, pointsEarned }] };
                } else {
                    updated.push({ id: phone, name: item.customerName, phone: item.customerPhone, points: pointsEarned, totalSpent: item.total, lastPurchase: new Date().toISOString(), history: [{ date: new Date().toISOString(), description: `Primeira Compra: ${item.productName}`, value: item.total, pointsEarned }] });
                }
            });
            return updated;
        });
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

  const SidebarContent = () => (
    <div className="space-y-8 mt-4">
       <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-4">Operacional</p>
          <div className="space-y-1">
            <NavItem view={View.VOLUNTEER_REPORT} icon={Store} label="Venda Balcão" />
            <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
            <NavItem view={View.CUSTOMERS} icon={Users} label="Clientes" />
            <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          </div>
       </div>
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
       <div className="pt-4 border-t border-zinc-900/50">
          <NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" />
       </div>
    </div>
  );

  const NavItem = ({ view, icon: Icon, label, badge }: any) => {
    const active = currentView === view;
    return (
        <button onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }} className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm mx-1 ${active ? 'bg-gradient-to-r from-zinc-900 to-transparent text-white border-l-2 border-green-500' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'}`}>
            <div className="flex items-center gap-3"><Icon size={18} className={`transition-colors ${active ? 'text-green-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} /><span>{label}</span></div>
            {badge > 0 && <span className="bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">{badge}</span>}
            {active && <ChevronRight size={14} className="text-zinc-700" />}
        </button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 font-sans selection:bg-green-500/30 selection:text-green-200">
      <aside className="hidden lg:flex flex-col w-72 bg-black/40 border-r border-white/5 p-4 fixed h-full z-20 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-6 pt-4 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-green-500/20 blur-[60px] rounded-full pointer-events-none"></div>
             <img src="/logo.png" alt="Sara Store" className="w-40 h-40 object-contain drop-shadow-2xl relative z-10 transition-transform hover:scale-105 duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
             <div className="mt-4 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest text-center">SARA {unitName.toUpperCase()}</p>
             </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar"><SidebarContent /></div>
        <div className="p-4 mt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center text-xs font-bold shadow-lg shadow-green-500/20">A</div>
                <div><p className="text-xs font-bold text-white">Admin</p><p className="text-[10px] text-zinc-500">Logado</p></div>
            </div>
            <button onClick={onLogoutUnit} className="text-zinc-500 hover:text-red-500 transition-colors" title="Sair da Unidade"><LogOut size={16}/></button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 w-full bg-black/80 backdrop-blur-md z-30 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3"><img src="/logo.png" className="w-10 h-10" alt="Logo" /><div className="flex flex-col"><span className="font-bold text-sm tracking-widest text-white">SARA STORE</span><span className="text-[9px] text-green-500 font-bold uppercase">{unitName}</span></div></div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400"><Menu size={24} /></button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-zinc-950 w-3/4 h-full p-6 border-r border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-8"><img src="/logo.png" alt="Sara Store" className="w-24 h-24 object-contain mb-4" /></div>
            <SidebarContent />
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-72 p-4 lg:p-10 pt-24 lg:pt-10 transition-all min-h-screen relative">
        <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
          {currentView === View.DASHBOARD && (
            !isDashboardUnlocked ? (
                <div className="flex flex-col items-center justify-center h-[85vh]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-green-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="relative bg-zinc-900/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                                <Lock size={20} className="text-green-500"/>
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Gestão {unitName}</h2>
                            <p className="text-xs text-zinc-500 font-medium">Área exclusiva para Liderança</p>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">E-mail</label><div className="relative group/input"><Mail size={16} className="absolute left-4 top-3.5 text-zinc-500 group-focus-within/input:text-green-500 transition-colors" /><input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all" placeholder={`admin@${unitId}.com`} /></div></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Senha</label><div className="relative group/input"><Key size={16} className="absolute left-4 top-3.5 text-zinc-500 group-focus-within/input:text-green-500 transition-colors" /><input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDashboardLogin()} className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all" placeholder="••••••" /></div></div>
                            <button onClick={handleDashboardLogin} disabled={isLoadingLogin} className="w-full bg-gradient-to-br from-green-600 to-green-700 text-white py-3.5 rounded-xl font-bold text-sm hover:from-green-500 hover:to-green-600 transition-all shadow-lg shadow-green-900/20 transform active:scale-[0.98] mt-2 flex items-center justify-center gap-2">{isLoadingLogin ? <span className="animate-pulse">Autenticando...</span> : "Acessar Painel"}</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute top-0 right-0 z-10"><button onClick={handleLockDashboard} className="bg-black/40 backdrop-blur text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/5 transition-all"><LogOut size={14} /> Bloquear</button></div>
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

// --- COMPONENTE PRINCIPAL (SELETOR DE UNIDADE) ---
const App: React.FC = () => {
    // 1. DADOS DAS REGIONAIS PERSISTIDOS
    const [units, setUnits] = useLocalStorage<RegionalUnit[]>('sara_regional_units', [
        { id: 'freguesia', name: 'Freguesia', color: 'green', password: '123' },
        { id: 'barra', name: 'Barra da Tijuca', color: 'blue', password: '123' },
        { id: 'gardenia', name: 'Gardênia Azul', color: 'orange', password: '123' },
    ]);

    const [selectedUnitId, setSelectedUnitId] = useLocalStorage<string | null>('sara_regional_selected_unit', null);
    
    // Estados para Modais
    const [loginModalUnit, setLoginModalUnit] = useState<RegionalUnit | null>(null); // Qual unidade está tentando logar
    const [loginPassword, setLoginPassword] = useState('');
    
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');
    const [newUnitPass, setNewUnitPass] = useState('');

    const handleSelectUnit = (unit: RegionalUnit) => {
        setLoginModalUnit(unit);
        setLoginPassword('');
    };

    const handleConfirmLogin = () => {
        if (!loginModalUnit) return;
        if (loginPassword === loginModalUnit.password) {
            setSelectedUnitId(loginModalUnit.id);
            setLoginModalUnit(null);
        } else {
            alert("Senha incorreta!");
        }
    };

    const handleCreateUnit = () => {
        if (!newUnitName || !newUnitPass) { alert("Preencha todos os campos!"); return; }
        const newId = newUnitName.toLowerCase().replace(/\s+/g, '_');
        
        // Verifica se já existe
        if (units.some(u => u.id === newId)) { alert("Essa regional já existe!"); return; }

        const newUnit: RegionalUnit = {
            id: newId,
            name: newUnitName,
            color: 'green', // Cor padrão
            password: newUnitPass
        };

        setUnits(prev => [...prev, newUnit]);
        setAddModalOpen(false);
        setNewUnitName('');
        setNewUnitPass('');
        alert(`Regional ${newUnitName} criada com sucesso!`);
    };

    const handleDeleteUnit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const confirm = window.prompt("Digite 'DELETAR' para apagar esta regional e todos os dados dela para sempre:");
        if (confirm === 'DELETAR') {
            setUnits(prev => prev.filter(u => u.id !== id));
            // Opcional: Limpar localStorage dessa unit aqui
        }
    };

    const selectedUnit = units.find(u => u.id === selectedUnitId);

    if (selectedUnit) {
        return (
            <StoreSystem 
                key={selectedUnit.id} 
                unitId={selectedUnit.id} 
                unitName={selectedUnit.name} 
                onLogoutUnit={() => setSelectedUnitId(null)} 
            />
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
             {/* BACKGROUND ANIMADO */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black"></div>
             
             <div className="relative z-10 w-full max-w-5xl text-center">
                 <div className="mb-12 animate-fade-in-up">
                     <img src="/logo.png" alt="Sara Store" className="w-32 h-32 object-contain mx-auto mb-6 drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                     <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">SARA <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">REGIONAL</span></h1>
                     <p className="text-zinc-400 text-lg">Selecione sua unidade para acessar o sistema</p>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                     {/* LISTA DE REGIONAIS */}
                     {units.map((unit) => (
                         <button 
                            key={unit.id}
                            onClick={() => handleSelectUnit(unit)}
                            className="group relative bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-xl border border-zinc-800 hover:border-green-500/50 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-900/20 flex flex-col items-center gap-4 text-left"
                         >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div onClick={(e) => handleDeleteUnit(e, unit.id)} className="p-2 hover:bg-red-500/20 text-zinc-600 hover:text-red-500 rounded-full transition-colors"><Trash2 size={14}/></div>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-zinc-950 border border-zinc-800 group-hover:border-green-500 group-hover:text-green-400 transition-colors shadow-lg`}>
                                <MapPin size={20} className="text-zinc-500 group-hover:text-green-500 transition-colors" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-white font-bold text-lg group-hover:text-green-400 transition-colors">{unit.name}</h3>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <Lock size={10} className="text-zinc-600 group-hover:text-green-600"/>
                                    <p className="text-zinc-600 text-xs font-medium uppercase tracking-wider group-hover:text-zinc-400">Protegido</p>
                                </div>
                            </div>
                         </button>
                     ))}

                     {/* BOTÃO ADICIONAR NOVA */}
                     <button 
                        onClick={() => setAddModalOpen(true)}
                        className="group relative bg-zinc-950/30 hover:bg-zinc-900 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[160px]"
                     >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                            <Plus size={24} className="text-zinc-500 group-hover:text-white" />
                        </div>
                        <p className="text-zinc-500 font-bold text-sm group-hover:text-white">Adicionar Regional</p>
                     </button>
                 </div>
             </div>

             {/* MODAL DE LOGIN NA REGIONAL */}
             {loginModalUnit && (
                 <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500"></div>
                        <h2 className="text-2xl font-bold text-white mb-2">{loginModalUnit.name}</h2>
                        <p className="text-zinc-500 text-sm mb-6">Digite a senha da unidade para entrar</p>
                        
                        <input 
                            autoFocus
                            type="password" 
                            value={loginPassword} 
                            onChange={e => setLoginPassword(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleConfirmLogin()}
                            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white text-center tracking-widest outline-none focus:border-green-500 mb-4" 
                            placeholder="••••"
                        />
                        
                        <div className="flex gap-3">
                            <button onClick={() => setLoginModalUnit(null)} className="flex-1 py-3 text-zinc-500 hover:text-white font-bold transition-colors">Cancelar</button>
                            <button onClick={handleConfirmLogin} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-colors">Acessar</button>
                        </div>
                     </div>
                 </div>
             )}

             {/* MODAL CRIAR REGIONAL */}
             {addModalOpen && (
                 <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden animate-fade-in">
                        <button onClick={() => setAddModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20}/></button>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-center gap-2"><Plus size={20} className="text-green-500"/> Nova Regional</h2>
                        
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nome da Regional</label>
                                <input value={newUnitName} onChange={e => setNewUnitName(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500" placeholder="Ex: Bangu" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Senha de Acesso</label>
                                <input type="password" value={newUnitPass} onChange={e => setNewUnitPass(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500" placeholder="Crie uma senha segura" />
                            </div>
                            <button onClick={handleCreateUnit} className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors mt-2">Criar Unidade</button>
                        </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default App;
