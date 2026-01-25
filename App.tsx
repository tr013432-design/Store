import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, DailyReport, OrderSheet, AdminUser, Customer } from './types';
import { Dashboard } from './components/Dashboard';
import { VolunteerSales } from './components/VolunteerSales'; 
import { ReportValidation } from './components/ReportValidation';
import { Orders } from './components/Orders'; 
import { Inventory } from './components/Inventory';
import { Settings } from './components/Settings'; 
import { Deliveries } from './components/Deliveries';
import { Loyalty } from './components/Loyalty';
import { Customers } from './components/Customers'; // <--- IMPORT NOVO
import { useLocalStorage } from './hooks/useLocalStorage';
import { LayoutDashboard, Package, Menu, ClipboardList, CheckCircle, ShoppingBag, Settings as SettingsIcon, Lock, Mail, Key, LogOut, Truck, Star, Users } from 'lucide-react';

// Adicionei CUSTOMERS no enum
enum View { DASHBOARD, VOLUNTEER_REPORT, ORDERS, VALIDATION, INVENTORY, SETTINGS, DELIVERIES, LOYALTY, CUSTOMERS }

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  const [products, setProducts] = useLocalStorage<Product[]>('db_products', MOCK_PRODUCTS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('db_transactions', MOCK_TRANSACTIONS as any);
  const [reports, setReports] = useLocalStorage<DailyReport[]>('db_reports', []);
  const [orders, setOrders] = useLocalStorage<OrderSheet[]>('db_orders', []); 
  const [customers, setCustomers] = useLocalStorage<Customer[]>('db_customers', []); 

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [availableVolunteers, setAvailableVolunteers] = useLocalStorage<string[]>('cfg_volunteers', ['Eloá Batista', 'Thiago Rodrigues']);
  const [availableServices, setAvailableServices] = useLocalStorage<string[]>('cfg_services', ['Culto da Família', 'Culto Profético', 'Arena', 'Culto de Fé e Milagres']);
  const [admins, setAdmins] = useLocalStorage<AdminUser[]>('cfg_admins', [{ id: '1', name: 'Admin', email: 'admin@sara.com', password: '123' }]);

  const addVolunteer = (name: string) => setAvailableVolunteers(prev => [...prev, name]);
  const removeVolunteer = (name: string) => setAvailableVolunteers(prev => prev.filter(v => v !== name));
  const addService = (service: string) => setAvailableServices(prev => [...prev, service]);
  const removeService = (service: string) => setAvailableServices(prev => prev.filter(s => s !== service));
  const addAdmin = (newAdmin: Omit<AdminUser, 'id'>) => setAdmins(prev => [...prev, { ...newAdmin, id: Date.now().toString() }]);
  const removeAdmin = (id: string) => setAdmins(prev => prev.filter(a => a.id !== id));

  const handleDashboardLogin = () => {
    const admin = admins.find(a => a.email === loginEmail && a.password === loginPass);
    if (admin) { setIsDashboardUnlocked(true); setLoginEmail(''); setLoginPass(''); } else { alert("🚫 Acesso Negado!"); }
  };
  const handleLockDashboard = () => setIsDashboardUnlocked(false);

  const handleReportSubmit = (newReportData: Omit<DailyReport, 'id' | 'status'>) => { setReports(prev => [{ ...newReportData, id: `rep-${Date.now()}`, status: 'PENDENTE' }, ...prev]); };
  const handleOrderSubmit = (newOrderData: Omit<OrderSheet, 'id' | 'status'>) => { setOrders(prev => [{ ...newOrderData, id: `ord-${Date.now()}`, status: 'PENDENTE' }, ...prev]); };
  
  const handleToggleReportItem = (reportId: string, itemIndex: number) => { setReports(prev => prev.map(r => r.id === reportId ? { ...r, items: r.items.map((it, idx) => idx === itemIndex ? { ...it, checked: !it.checked } : it) } : r)); };
  const handleToggleOrderItem = (orderId: string, itemIndex: number) => { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: o.items.map((it, idx) => idx === itemIndex ? { ...it, checked: !it.checked } : it) } : o)); };

  const handleValidateReport = (reportId: string, adminName: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'VALIDADO', validatedBy: adminName } : r));
    const report = reports.find(r => r.id === reportId);
    if (report) {
        const itemsForTransaction = report.items.filter(i => i.paymentMethod !== 'Sara Points');
        if (itemsForTransaction.length > 0) {
            const newTrans: Transaction = { 
                id: `tx-rep-${report.id}`, 
                date: report.date, 
                items: itemsForTransaction.map(i => ({ id: i.productName, name: i.productName, price: i.total / i.quantity, category: 'Outros' as any, stock: 0, quantity: i.quantity })), 
                total: itemsForTransaction.reduce((acc, item) => acc + item.total, 0), 
                paymentMethod: 'Dinheiro', 
                volunteerName: report.volunteerName, 
                serviceType: report.serviceType 
            };
            setTransactions(prev => [newTrans, ...prev]);
        }
        setProducts(prevProds => prevProds.map(prod => { const itemSold = report.items.find(i => i.productName === prod.name); return itemSold ? { ...prod, stock: prod.stock - itemSold.quantity } : prod; }));
        
        // Atualiza Sara Points
        setCustomers(prevCustomers => {
            let updatedCustomers = [...prevCustomers];
            report.items.forEach(item => {
                if (item.customerPhone) {
                    const phone = item.customerPhone.replace(/\D/g, '');
                    const existingIndex = updatedCustomers.findIndex(c => c.id === phone);
                    const pointsChange = item.paymentMethod === 'Sara Points' ? -Math.floor(item.total) : Math.floor(item.total);
                    const description = item.paymentMethod === 'Sara Points' ? `Resgate: ${item.productName}` : `Compra: ${item.productName}`;

                    if (existingIndex >= 0) {
                        const current = updatedCustomers[existingIndex];
                        updatedCustomers[existingIndex] = {
                            ...current,
                            points: current.points + pointsChange,
                            totalSpent: item.paymentMethod !== 'Sara Points' ? current.totalSpent + item.total : current.totalSpent,
                            lastPurchase: new Date().toISOString(),
                            history: [...current.history, { date: new Date().toISOString(), description, value: item.total, pointsEarned: pointsChange }]
                        };
                    } else if (pointsChange > 0) {
                        updatedCustomers.push({
                            id: phone,
                            name: `Cliente ${phone.slice(-4)}`, 
                            phone: item.customerPhone, // Salva o telefone formatado
                            points: pointsChange,
                            totalSpent: item.total,
                            lastPurchase: new Date().toISOString(),
                            history: [{ date: new Date().toISOString(), description, value: item.total, pointsEarned: pointsChange }]
                        });
                    }
                }
            });
            return updatedCustomers;
        });
    }
  };

  const handleUnvalidateReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'PENDENTE', validatedBy: undefined } : r));
    setTransactions(prev => prev.filter(t => t.id !== `tx-rep-${reportId}`));
    const report = reports.find(r => r.id === reportId);
    if (report) { setProducts(prevProds => prevProds.map(prod => { const itemSold = report.items.find(i => i.productName === prod.name); return itemSold ? { ...prod, stock: prod.stock + itemSold.quantity } : prod; })); }
  };

  const handleValidateOrder = (orderId: string, adminName: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ENTREGUE', validatedBy: adminName } : o));
    const orderSheet = orders.find(o => o.id === orderId);
    if (orderSheet) {
        const newTrans: Transaction = { 
            id: `tx-ord-${orderSheet.id}`, 
            date: orderSheet.date,
            items: orderSheet.items.map(i => ({ id: i.productName, name: i.productName, price: i.total / i.quantity, category: 'Outros' as any, stock: 0, quantity: i.quantity })), 
            total: orderSheet.grandTotal, 
            paymentMethod: 'Dinheiro',
            volunteerName: orderSheet.volunteerName,
            serviceType: orderSheet.serviceType
        };
        setTransactions(prev => [newTrans, ...prev]);

        setCustomers(prevCustomers => {
            let updatedCustomers = [...prevCustomers];
            orderSheet.items.forEach(item => {
                const phone = item.customerPhone.replace(/\D/g, ''); 
                const name = item.customerName;
                const pointsEarned = Math.floor(item.total); 
                const existingIndex = updatedCustomers.findIndex(c => c.id === phone);

                if (existingIndex >= 0) {
                    updatedCustomers[existingIndex] = {
                        ...updatedCustomers[existingIndex],
                        points: updatedCustomers[existingIndex].points + pointsEarned,
                        totalSpent: updatedCustomers[existingIndex].totalSpent + item.total,
                        lastPurchase: new Date().toISOString(),
                        history: [...updatedCustomers[existingIndex].history, { date: new Date().toISOString(), description: `Compra: ${item.productName}`, value: item.total, pointsEarned }]
                    };
                } else {
                    updatedCustomers.push({
                        id: phone,
                        name: name,
                        phone: item.customerPhone, // Salva o formatado
                        team: item.customerTeam,   // Salva a equipe se tiver vindo da encomenda
                        points: pointsEarned,
                        totalSpent: item.total,
                        lastPurchase: new Date().toISOString(),
                        history: [{ date: new Date().toISOString(), description: `Primeira Compra: ${item.productName}`, value: item.total, pointsEarned }]
                    });
                }
            });
            return updatedCustomers;
        });
    }
    alert("Encomenda validada! Pontos adicionados.");
  };

  const handleUnvalidateOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PENDENTE', validatedBy: undefined } : o));
    setTransactions(prev => prev.filter(t => t.id !== `tx-ord-${orderId}`));
  };

  const handleMarkItemDelivered = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(order => {
        if (order.id === orderId) { return { ...order, items: order.items.map(item => item.id === itemId ? { ...item, delivered: true } : item) }; }
        return order;
    }));
  };

  const handleManualAddPoints = (phone: string, points: number) => {
      setCustomers(prev => prev.map(c => c.id === phone ? { ...c, points: c.points + points } : c));
      alert("Pontos adicionados manualmente!");
  };

  const handleRedeemReward = (phone: string, cost: number) => {
      const customer = customers.find(c => c.id === phone);
      if (customer && customer.points < cost) { alert("❌ Erro: Saldo insuficiente."); return; }
      setCustomers(prev => prev.map(c => c.id === phone ? { 
          ...c, points: c.points - cost,
          history: [...c.history, { date: new Date().toISOString(), description: "Resgate de Prêmio 🎁", value: 0, pointsEarned: -cost }]
      } : c));
      alert("Prêmio resgatado com sucesso!");
  };

  // --- FUNÇÃO PARA SALVAR CLIENTE NA NOVA ABA ---
  const handleSaveCustomer = (newCustomer: Customer) => {
      setCustomers(prev => {
          const exists = prev.find(c => c.id === newCustomer.id);
          if (exists) {
              // Atualiza
              return prev.map(c => c.id === newCustomer.id ? { ...c, ...newCustomer, points: c.points, totalSpent: c.totalSpent, history: c.history } : c);
          } else {
              // Cria novo
              return [...prev, newCustomer];
          }
      });
      alert("Cliente salvo com sucesso!");
  };

  const handleDeleteCustomer = (id: string) => setCustomers(prev => prev.filter(c => c.id !== id));

  const handleUpdateProduct = (updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  const handleAddProduct = (newProduct: Product) => setProducts(prev => [...prev, newProduct]);
  const handleDeleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

  const NavItem = ({ view, icon: Icon, label, badge }: any) => (
    <button onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-bold uppercase tracking-wide text-xs ${currentView === view ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-zinc-400 hover:bg-zinc-800 hover:text-green-400'}`}>
      <div className="relative"><Icon size={20} />{badge && badge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}</div><span>{label}</span>
    </button>
  );

  const pendingCount = reports.filter(r => r.status === 'PENDENTE').length + orders.filter(o => o.status === 'PENDENTE').length;
  const pendingDeliveries = orders.filter(o => o.status === 'ENTREGUE').flatMap(o => o.items).filter(i => !i.delivered).length;

  return (
    <div className="min-h-screen bg-black flex font-sans text-zinc-100">
      
      <aside className="hidden lg:flex flex-col w-72 bg-zinc-900 border-r border-zinc-800 p-6 fixed h-full z-10">
        <div className="flex flex-col items-center mb-6 w-full">
            <div className="w-56 h-56 flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full opacity-50"></div>
                 <img src="/logo.png" alt="Sara Store" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                 <div className="hidden relative z-10 flex flex-col items-center animate-fade-in text-center"><ShoppingBag size={64} className="text-green-500 mb-2" /><h1 className="text-lg font-black tracking-[0.2em] text-green-500 uppercase text-center leading-none">SARA<br/>STORE</h1></div>
            </div>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel Geral" />
          <NavItem view={View.VOLUNTEER_REPORT} icon={ClipboardList} label="Relatório Voluntário" />
          <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
          <NavItem view={View.VALIDATION} icon={CheckCircle} label="Validação Pastoral" badge={pendingCount} />
          <NavItem view={View.DELIVERIES} icon={Truck} label="Entregas" badge={pendingDeliveries} />
          <div className="my-4 border-t border-zinc-800 shrink-0"></div>
          <NavItem view={View.CUSTOMERS} icon={Users} label="Clientes" /> {/* NOVO */}
          <NavItem view={View.LOYALTY} icon={Star} label="Sara Points" />
          <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
          <div className="mt-auto pt-4 shrink-0"><NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" /></div>
        </nav>
      </aside>

      <div className="lg:hidden fixed top-0 w-full bg-zinc-900 z-20 border-b border-zinc-800 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3"><img src="/logo.png" className="w-10 h-10 rounded-full border border-green-500" /><span className="font-bold text-lg text-green-500 tracking-widest">SARA STORE</span></div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400"><Menu size={24} /></button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-zinc-900 w-3/4 h-full p-6 border-r border-zinc-800" onClick={e => e.stopPropagation()}>
            <nav className="space-y-2">
              <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Painel" />
              <NavItem view={View.VOLUNTEER_REPORT} icon={ClipboardList} label="Relatório" />
              <NavItem view={View.ORDERS} icon={ShoppingBag} label="Encomendas" />
              <NavItem view={View.VALIDATION} icon={CheckCircle} label="Validação" badge={pendingCount} />
              <NavItem view={View.DELIVERIES} icon={Truck} label="Entregas" badge={pendingDeliveries} />
              <NavItem view={View.CUSTOMERS} icon={Users} label="Clientes" />
              <NavItem view={View.LOYALTY} icon={Star} label="Sara Points" />
              <NavItem view={View.INVENTORY} icon={Package} label="Estoque" />
              <div className="border-t border-zinc-800 my-2 pt-2"><NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" /></div>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-24 lg:pt-8 transition-all bg-black min-h-screen">
        <div className="max-w-7xl mx-auto">
          {currentView === View.DASHBOARD && (
            !isDashboardUnlocked ? (
                <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in">
                    <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-zinc-800 w-full max-w-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-700"></div>
                        <div className="bg-zinc-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"><Lock size={36} /></div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-wide uppercase">Acesso Restrito</h2>
                        <p className="text-xs text-zinc-500 mb-8 uppercase tracking-widest">Gestão Financeira Sara Store</p>
                        <div className="space-y-4 text-left">
                            <div className="group"><label className="text-[10px] font-bold text-green-500 uppercase ml-1 mb-1 block">E-mail</label><div className="flex items-center gap-3 bg-black border border-zinc-700 rounded-xl px-4 py-3 group-focus-within:border-green-500 transition-colors"><Mail size={18} className="text-zinc-500"/><input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-transparent w-full outline-none text-sm text-white placeholder-zinc-700" placeholder="admin@sara.com" /></div></div>
                            <div className="group"><label className="text-[10px] font-bold text-green-500 uppercase ml-1 mb-1 block">Senha</label><div className="flex items-center gap-3 bg-black border border-zinc-700 rounded-xl px-4 py-3 group-focus-within:border-green-500 transition-colors"><Key size={18} className="text-zinc-500"/><input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDashboardLogin()} className="bg-transparent w-full outline-none text-sm text-white placeholder-zinc-700" placeholder="••••••" /></div></div>
                            <button onClick={handleDashboardLogin} className="w-full bg-green-600 text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] mt-4">Desbloquear</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <button onClick={handleLockDashboard} className="absolute top-0 right-0 z-10 bg-zinc-900 border border-zinc-700 text-zinc-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-900/30 hover:text-red-500 flex items-center gap-2 transition-all"><LogOut size={14} /> Bloquear</button>
                    <Dashboard transactions={transactions} products={products} />
                </div>
            )
          )}

          {currentView === View.VOLUNTEER_REPORT && <VolunteerSales products={products} onSubmitReport={handleReportSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} customers={customers} />}
          {currentView === View.ORDERS && <Orders products={products} onSubmitOrders={handleOrderSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />}
          {currentView === View.VALIDATION && <ReportValidation reports={reports} orders={orders} admins={admins} onValidateReport={handleValidateReport} onValidateOrder={handleValidateOrder} onUnvalidateReport={handleUnvalidateReport} onUnvalidateOrder={handleUnvalidateOrder} onToggleReportItem={handleToggleReportItem} onToggleOrderItem={handleToggleOrderItem} />}
          {currentView === View.DELIVERIES && <Deliveries orders={orders} onMarkDelivered={handleMarkItemDelivered} />}
          {currentView === View.CUSTOMERS && <Customers customers={customers} onSaveCustomer={handleSaveCustomer} onDeleteCustomer={handleDeleteCustomer} />}
          {currentView === View.LOYALTY && <Loyalty customers={customers} onManualAddPoints={handleManualAddPoints} onRedeemReward={handleRedeemReward} />}
          {currentView === View.INVENTORY && <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />}
          {currentView === View.SETTINGS && <Settings volunteers={availableVolunteers} services={availableServices} admins={admins} onAddVolunteer={addVolunteer} onRemoveVolunteer={removeVolunteer} onAddService={addService} onRemoveService={removeService} onAddAdmin={addAdmin} onRemoveAdmin={removeAdmin} />}
        </div>
      </main>
    </div>
  );
};

export default App;
