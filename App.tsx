import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Product, Transaction, DailyReport, OrderSheet, AdminUser, Customer, Expense } from './types';
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
import {
  LayoutDashboard,
  Package,
  Menu,
  CheckCircle,
  ShoppingBag,
  Settings as SettingsIcon,
  Lock,
  LogOut,
  Truck,
  Star,
  Users,
  TrendingDown,
  Store,
  ChevronRight,
  MapPin,
  Plus,
  X,
  Trash2,
  Download
} from 'lucide-react';

// --- TIPOS ---
interface RegionalUnit {
  id: string;
  name: string;
  color: string;
  password: string;
}

enum View {
  DASHBOARD,
  VOLUNTEER_REPORT,
  ORDERS,
  VALIDATION,
  INVENTORY,
  SETTINGS,
  DELIVERIES,
  LOYALTY,
  CUSTOMERS,
  EXPENSES
}

// -------------------------
// Helpers (Fidelidade / Telefone / Pontos)
// -------------------------
const digitsOnly = (v: any) => String(v ?? '').replace(/\D/g, '');
const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// tenta puxar telefone de vários nomes possíveis (pra ser robusto)
const extractPhoneFromAny = (obj: any): string => {
  if (!obj) return '';
  return (
    digitsOnly(obj.phone) ||
    digitsOnly(obj.customerPhone) ||
    digitsOnly(obj.customer_phone) ||
    digitsOnly(obj.clientPhone) ||
    digitsOnly(obj.client_phone) ||
    digitsOnly(obj.telefone) ||
    digitsOnly(obj.tel) ||
    digitsOnly(obj.celular) ||
    digitsOnly(obj.whatsapp) ||
    ''
  );
};

const looksLikeUUID = (s: any) => typeof s === 'string' && s.includes('-') && s.length >= 20;

const normalizeCustomerRow = (row: any): Customer => {
  // se sua tabela já for camelCase, isso não atrapalha
  return {
    ...row,
    totalSpent: row.totalSpent ?? row.total_spent ?? 0,
    lastPurchase: row.lastPurchase ?? row.last_purchase ?? row.updated_at ?? row.created_at ?? new Date().toISOString(),
    points: row.points ?? row.pontos ?? 0,
    phone: row.phone ?? row.telefone ?? row.customer_phone ?? row.customerPhone ?? ''
  } as Customer;
};

// --- SISTEMA DA LOJA (Conectado ao Supabase) ---
const StoreSystem: React.FC<{ unitId: string; unitName: string; onLogoutUnit: () => void }> = ({
  unitId,
  unitName,
  onLogoutUnit
}) => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);

  // DADOS VINDOS DO BANCO
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [orders, setOrders] = useState<OrderSheet[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // DADO DERIVADO (Para o Dashboard funcionar sem mudar o componente)
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Configurações Locais
  const [pointsConfig, setPointsConfig] = useState<Record<string, number>>({
    'Livros e Bíblias': 15,
    'Vestuário': 30,
    'Papelaria': 5,
    'Acessórios': 5,
    'Outros': 1
  });
  const [pointsValue, setPointsValue] = useState<number>(0.1);
  const [availableVolunteers, setAvailableVolunteers] = useState<string[]>(['Voluntário 1', 'Voluntário 2']);
  const [availableServices, setAvailableServices] = useState<string[]>(['Culto da Família', 'Arena Jovem', 'Domingo']);
  const [admins, setAdmins] = useState<AdminUser[]>([{ id: '1', name: 'Admin', email: `admin@${unitId}.com`, password: '123' }]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  // --- CARREGAR DADOS AO ENTRAR ---
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const fetchData = async () => {
    setLoading(true);

    const { data: prodData } = await supabase.from('products').select('*').eq('unit_id', unitId);
    if (prodData) setProducts(prodData as any);

    const { data: custData } = await supabase.from('customers').select('*').eq('unit_id', unitId);
    if (custData) setCustomers((custData as any[]).map(normalizeCustomerRow));

    const { data: repData } = await supabase
      .from('reports')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });
    if (repData) setReports(repData as any);

    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });
    if (ordData) setOrders(ordData as any);

    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });
    if (expData) setExpenses(expData as any);

    setLoading(false);
  };

  // Atualiza as Transações (Dashboard) sempre que Relatórios ou Encomendas mudam
  useEffect(() => {
    const txReports = reports
      .filter(r => (r as any).status === 'VALIDADO')
      .map(r => ({
        id: (r as any).id,
        date: (r as any).date,
        total: (r as any).grandTotal,
        paymentMethod: 'Dinheiro',
        items: (r as any).items,
        volunteerName: (r as any).volunteerName,
        serviceType: (r as any).serviceType
      }));

    const txOrders = orders
      .filter(o => (o as any).status === 'ENTREGUE')
      .map(o => ({
        id: (o as any).id,
        date: (o as any).date,
        total: (o as any).grandTotal,
        paymentMethod: 'Dinheiro',
        items: (o as any).items,
        volunteerName: (o as any).volunteerName,
        serviceType: (o as any).serviceType
      }));

    setTransactions([...txReports, ...txOrders] as any);
  }, [reports, orders]);

  // -------------------------
  // Fidelidade (Supabase)
  // -------------------------

  // garante que existe customer pelo telefone
  const ensureCustomerByPhone = async (phoneRaw: string, nameRaw?: string) => {
    const phone = digitsOnly(phoneRaw);
    if (!phone) return null;

    const existing = customers.find(c => digitsOnly((c as any).phone) === phone);
    if (existing) return existing;

    const name = String(nameRaw ?? '').trim() || `Cliente ${phone.slice(-4)}`;

    const { data, error } = await supabase
      .from('customers')
      .insert([{ unit_id: unitId, phone, name, points: 0, totalSpent: 0, lastPurchase: new Date().toISOString() }])
      .select();

    if (error) {
      // se já existir por concorrência, só ignora
      return null;
    }
    if (data && data[0]) {
      const normalized = normalizeCustomerRow(data[0]);
      setCustomers(prev => [...prev, normalized]);
      return normalized;
    }
    return null;
  };

  // resolve identificador que pode ser UUID (id) ou telefone
  const resolvePhoneFromIdentifier = (identifier: string): { phone: string; customer: Customer | null } => {
    const asDigits = digitsOnly(identifier);
    if (asDigits) {
      const found = customers.find(c => digitsOnly((c as any).phone) === asDigits);
      return { phone: asDigits, customer: found ?? null };
    }

    // se veio UUID, tenta achar o customer pelo id
    const byId = customers.find(c => String((c as any).id) === String(identifier));
    const phone = digitsOnly((byId as any)?.phone);
    return { phone, customer: byId ?? null };
  };

  const updateCustomerPoints = async (identifier: string, deltaPoints: number, extra?: { addSpent?: number; lastPurchase?: string }) => {
    const { phone } = resolvePhoneFromIdentifier(identifier);
    if (!phone) return;

    // busca no estado
    let cust = customers.find(c => digitsOnly((c as any).phone) === phone) ?? null;

    // cria se não existir
    if (!cust) {
      cust = await ensureCustomerByPhone(phone);
    }
    if (!cust) return;

    const currentPoints = safeNum((cust as any).points, 0);
    const newPoints = currentPoints + deltaPoints;

    const currentSpent = safeNum((cust as any).totalSpent, 0);
    const addSpent = safeNum(extra?.addSpent, 0);
    const newSpent = currentSpent + addSpent;

    const lastPurchase = extra?.lastPurchase || new Date().toISOString();

    const { error } = await supabase
      .from('customers')
      .update({ points: newPoints, totalSpent: newSpent, lastPurchase })
      .eq('id', (cust as any).id);

    if (error) {
      alert('Erro ao atualizar pontos: ' + error.message);
      return;
    }

    setCustomers(prev =>
      prev.map(c =>
        String((c as any).id) === String((cust as any).id)
          ? ({ ...c, points: newPoints, totalSpent: newSpent, lastPurchase } as any)
          : c
      )
    );
  };

  // calcula pontos por item/categoria
  const computePointsFromItems = (items: any[]): number => {
    let total = 0;

    for (const it of items || []) {
      const qty = Math.max(1, Math.trunc(safeNum(it.quantity, 1)));

      // tenta achar categoria de vários jeitos
      const catFromItem = String(it.category ?? it.productCategory ?? it.product_category ?? '');
      let cat = catFromItem;

      if (!cat) {
        const prodByName = products.find(p => String((p as any).name).trim() === String(it.productName).trim());
        if (prodByName) cat = String((prodByName as any).category ?? '');
      }

      const ptsPerItem = safeNum(pointsConfig[cat], 0);
      total += ptsPerItem * qty;
    }

    return Math.max(0, Math.trunc(total));
  };

  const extractCustomerIdentifierFromReport = (rep: any): string => {
    // prioridade: telefone direto
    const phone =
      extractPhoneFromAny(rep) ||
      extractPhoneFromAny(rep?.customer) ||
      extractPhoneFromAny(rep?.client) ||
      '';

    if (phone) return phone;

    // fallback: se tiver customerId uuid, usa isso
    if (rep?.customerId) return String(rep.customerId);
    if (rep?.customer_id) return String(rep.customer_id);
    if (rep?.customerUUID) return String(rep.customerUUID);

    // último fallback: nada
    return '';
  };

  // -------------------------
  // --- FUNÇÕES DE BANCO DE DADOS (CRUD)
  // -------------------------

  const handleAddProduct = async (prod: Product) => {
    const { id, ...newProd } = prod as any;
    const { data, error } = await supabase.from('products').insert([{ ...newProd, unit_id: unitId }]).select();
    if (data) setProducts([data[0] as any, ...products]);
    if (error) alert('Erro ao criar: ' + error.message);
  };

  const handleUpdateProduct = async (prod: Product) => {
    const { error } = await supabase.from('products').update(prod as any).eq('id', (prod as any).id);
    if (!error) setProducts(products.map(p => ((p as any).id === (prod as any).id ? prod : p)));
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(products.filter(p => (p as any).id !== id));
  };

  const handleReportSubmit = async (d: any) => {
    const { data, error } = await supabase.from('reports').insert([{ ...d, unit_id: unitId, status: 'PENDENTE' }]).select();
    if (data) {
      setReports([data[0] as any, ...reports]);

      // ✅ garante cliente criado (pra já aparecer na fidelidade)
      const phone = extractPhoneFromAny(d);
      if (phone) {
        await ensureCustomerByPhone(phone, d?.customerName || d?.name);
      }

      alert('Venda enviada para validação!');
    }
    if (error) alert('Erro: ' + error.message);
  };

  const handleOrderSubmit = async (d: any) => {
    const { data, error } = await supabase.from('orders').insert([{ ...d, unit_id: unitId, status: 'PENDENTE' }]).select();
    if (data) {
      setOrders([data[0] as any, ...orders]);
      alert('Encomenda registrada!');
    }
    if (error) alert('Erro: ' + error.message);
  };

  // ✅ VALIDAR VENDA = baixa estoque + soma pontos de fidelidade
  const handleValidateReport = async (id: string, admin: string) => {
    // 1) Atualiza Status
    const { error } = await supabase.from('reports').update({ status: 'VALIDADO', validated_by: admin }).eq('id', id);
    if (error) return alert('Erro ao validar: ' + error.message);

    const rep = reports.find(r => String((r as any).id) === String(id)) as any;
    if (!rep) return;

    // Atualiza UI Imediatamente
    setReports(prev => prev.map(r => (String((r as any).id) === String(id) ? ({ ...r, status: 'VALIDADO', validatedBy: admin } as any) : r)));

    // 2) Baixa Estoque
    for (const item of rep.items || []) {
      const product = products.find(p => String((p as any).name) === String(item.productName));
      if (product) {
        const newStock = safeNum((product as any).stock, 0) - safeNum(item.quantity, 0);
        await supabase.from('products').update({ stock: newStock }).eq('id', (product as any).id);
        setProducts(prev => prev.map(p => ((p as any).id === (product as any).id ? ({ ...p, stock: newStock } as any) : p)));
      }
    }

    // 3) ✅ FIDELIDADE: calcula pontos por categoria e soma no cliente
    const identifier = extractCustomerIdentifierFromReport(rep);

    // se não veio telefone/uuid, não tem como pontuar
    if (!identifier) return;

    // se vier uuid, resolve o phone
    let phoneForEnsure = '';
    if (looksLikeUUID(identifier)) {
      const byId = customers.find(c => String((c as any).id) === String(identifier));
      phoneForEnsure = digitsOnly((byId as any)?.phone);
    } else {
      phoneForEnsure = digitsOnly(identifier);
    }

    if (phoneForEnsure) {
      await ensureCustomerByPhone(phoneForEnsure, rep?.customerName || rep?.name);
    }

    const earnedPoints = computePointsFromItems(rep.items || []);
    if (earnedPoints > 0) {
      await updateCustomerPoints(
        identifier,
        earnedPoints,
        {
          addSpent: safeNum(rep.grandTotal, 0),
          lastPurchase: rep.date ? new Date(rep.date).toISOString() : new Date().toISOString()
        }
      );
    }
  };

  const handleAddExpense = async (newExp: Expense) => {
    const { data, error } = await supabase.from('expenses').insert([{ ...(newExp as any), unit_id: unitId }]).select();
    if (data) setExpenses([data[0] as any, ...expenses]);
    if (error) alert('Erro despesa: ' + error.message);
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(e => (e as any).id !== id));
  };

  const handleSaveCustomer = async (c: Customer) => {
    const phone = digitsOnly((c as any).phone);
    const existing = customers.find(cust => digitsOnly((cust as any).phone) === phone);

    if (existing) {
      const { error } = await supabase.from('customers').update(c as any).eq('id', (existing as any).id);
      if (!error) setCustomers(prev => prev.map(x => ((x as any).id === (existing as any).id ? ({ ...x, ...(c as any) } as any) : x)));
    } else {
      const { id, ...newCust } = c as any;
      const { data, error } = await supabase.from('customers').insert([{ ...newCust, unit_id: unitId }]).select();
      if (data) setCustomers(prev => [...prev, normalizeCustomerRow(data[0])]);
      if (error) alert('Erro cliente: ' + error.message);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
    setCustomers(p => p.filter(x => String((x as any).id) !== String(id)));
  };

  // -------------------------
  // ✅ Fidelidade manual (Loyalty component chama essas)
  // -------------------------
  const handleManualAddPoints = async (identifier: string, points: number) => {
    const p = Math.trunc(safeNum(points, 0));
    if (!p) return;
    await updateCustomerPoints(identifier, p);
  };

  const handleRedeemReward = async (identifier: string, cost: number) => {
    const c = Math.max(0, Math.trunc(safeNum(cost, 0)));
    if (!c) return;

    const { phone } = resolvePhoneFromIdentifier(identifier);
    if (!phone) return;

    const cust = customers.find(x => digitsOnly((x as any).phone) === phone);
    if (!cust) return;

    const currentPoints = safeNum((cust as any).points, 0);
    if (currentPoints < c) return alert('Saldo insuficiente.');

    await updateCustomerPoints(identifier, -c);
  };

  // -------------------------
  // ✅ Validações / Logística (antes estavam placeholders)
  // -------------------------
  const handleValidateOrder = async (id: string, admin: string) => {
    const { error } = await supabase.from('orders').update({ status: 'ENTREGUE', validated_by: admin }).eq('id', id);
    if (error) return alert('Erro ao validar encomenda: ' + error.message);

    setOrders(prev => prev.map(o => (String((o as any).id) === String(id) ? ({ ...o, status: 'ENTREGUE', validatedBy: admin } as any) : o)));
    alert('Encomenda Entregue!');
  };

  const handleMarkItemDelivered = async (orderId: string, itemId: string) => {
    const order = orders.find(o => String((o as any).id) === String(orderId)) as any;
    if (!order) return;

    const now = new Date().toISOString();
    const updatedItems = (order.items || []).map((it: any, idx: number) => {
      const itKey =
        String(it?.id ?? it?.itemId ?? it?.productId ?? it?.barcode ?? `${orderId}-${idx}`);
      const match =
        String(it?.id) === String(itemId) ||
        String(it?.itemId) === String(itemId) ||
        String(it?.productId) === String(itemId) ||
        String(itKey) === String(itemId);

      if (!match) return it;

      return { ...it, delivered: true, deliveredAt: it.deliveredAt ?? now };
    });

    const { error } = await supabase.from('orders').update({ items: updatedItems }).eq('id', orderId);
    if (error) return alert('Erro ao marcar entregue: ' + error.message);

    setOrders(prev => prev.map(o => (String((o as any).id) === String(orderId) ? ({ ...o, items: updatedItems } as any) : o)));
  };

  // Placeholders mantidos (se você ainda não usa)
  const handleUnvalidateReport = (id: string) => {};
  const handleUnvalidateOrder = (id: string) => {};
  const handleToggleReportItem = (id: string, idx: number) => {};
  const handleToggleOrderItem = (id: string, idx: number) => {};

  const addVolunteer = (n: string) => setAvailableVolunteers(p => [...p, n]);
  const removeVolunteer = (n: string) => setAvailableVolunteers(p => p.filter(v => v !== n));
  const addService = (s: string) => setAvailableServices(p => [...p, s]);
  const removeService = (s: string) => setAvailableServices(p => p.filter(x => x !== s));
  const addAdmin = (a: any) => setAdmins(p => [...p, { ...a, id: Date.now().toString() }]);
  const removeAdmin = (id: string) => setAdmins(p => p.filter(a => (a as any).id !== id));

  const pendingCount =
    reports.filter(r => (r as any).status === 'PENDENTE').length + orders.filter(o => (o as any).status === 'PENDENTE').length;

  // --- LOGIN DASHBOARD ---
  const handleDashboardLogin = () => {
    setIsLoadingLogin(true);
    setTimeout(() => {
      const admin = admins.find(a => (a as any).email === loginEmail && (a as any).password === loginPass);
      if (admin) {
        setIsDashboardUnlocked(true);
        setLoginEmail('');
        setLoginPass('');
      } else {
        alert(`🚫 Acesso Negado!`);
      }
      setIsLoadingLogin(false);
    }, 800);
  };

  // --- UI RENDER ---
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
          <NavItem view={View.DELIVERIES} icon={Truck} label="Logística" />
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
      <button
        onClick={() => {
          setCurrentView(view);
          setMobileMenuOpen(false);
        }}
        className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm mx-1 ${
          active ? 'bg-gradient-to-r from-zinc-900 to-transparent text-white border-l-2 border-green-500' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={`transition-colors ${active ? 'text-green-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
          <span>{label}</span>
        </div>
        {badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">
            {badge}
          </span>
        )}
        {active && <ChevronRight size={14} className="text-zinc-700" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 font-sans selection:bg-green-500/30 selection:text-green-200">
      <aside className="hidden lg:flex flex-col w-72 bg-black/40 border-r border-white/5 p-4 fixed h-full z-20 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-6 pt-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-green-500/20 blur-[60px] rounded-full pointer-events-none"></div>
          <img
            src="/logo.png"
            alt="Sara Store"
            className="w-40 h-40 object-contain drop-shadow-2xl relative z-10 transition-transform hover:scale-105 duration-500"
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="mt-4 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest text-center">SARA {unitName.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <SidebarContent />
        </div>
        <div className="p-4 mt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center text-xs font-bold shadow-lg shadow-green-500/20">
              A
            </div>
            <div>
              <p className="text-xs font-bold text-white">Admin</p>
              <p className="text-[10px] text-zinc-500">Logado</p>
            </div>
          </div>
          <button onClick={onLogoutUnit} className="text-zinc-500 hover:text-red-500 transition-colors" title="Sair da Unidade">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 w-full bg-black/80 backdrop-blur-md z-30 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-10 h-10" alt="Logo" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-widest text-white">SARA STORE</span>
            <span className="text-[9px] text-green-500 font-bold uppercase">{unitName}</span>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400">
          <Menu size={24} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-zinc-950 w-3/4 h-full p-6 border-r border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-72 p-4 lg:p-10 pt-24 lg:pt-10 transition-all min-h-screen relative">
        <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
          {loading ? (
            <div className="flex items-center justify-center h-[50vh] flex-col gap-4">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-sm animate-pulse">Carregando dados da nuvem...</p>
            </div>
          ) : (
            currentView === View.DASHBOARD && (
              !isDashboardUnlocked ? (
                <div className="flex flex-col items-center justify-center h-[80vh]">
                  <div className="bg-zinc-900/80 p-10 rounded-3xl border border-white/10 max-w-sm w-full text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <Lock size={30} className="text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-6">Área Restrita</h2>
                    <input
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 mb-3 text-white focus:border-green-500 outline-none transition-all"
                      placeholder="Email"
                    />
                    <input
                      type="password"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleDashboardLogin()}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 mb-6 text-white focus:border-green-500 outline-none transition-all"
                      placeholder="Senha"
                    />
                    <button
                      onClick={handleDashboardLogin}
                      disabled={isLoadingLogin}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-all"
                    >
                      {isLoadingLogin ? 'Entrando...' : 'Acessar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-0 right-0 z-10">
                    <button
                      onClick={() => setIsDashboardUnlocked(false)}
                      className="bg-black/40 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/5 hover:bg-white/5 transition-all"
                    >
                      <LogOut size={14} /> Bloquear
                    </button>
                  </div>
                  <Dashboard transactions={transactions} products={products} expenses={expenses} />
                </div>
              )
            )
          )}

          {!loading && currentView === View.VOLUNTEER_REPORT && (
            <VolunteerSales
              products={products}
              onSubmitReport={handleReportSubmit}
              availableVolunteers={availableVolunteers}
              availableServices={availableServices}
              customers={customers}
              pointsValue={pointsValue}
            />
          )}
          {!loading && currentView === View.ORDERS && (
            <Orders products={products} onSubmitOrders={handleOrderSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />
          )}
          {!loading && currentView === View.VALIDATION && (
            <ReportValidation
              reports={reports}
              orders={orders}
              admins={admins}
              onValidateReport={handleValidateReport}
              onValidateOrder={handleValidateOrder}
              onUnvalidateReport={handleUnvalidateReport}
              onUnvalidateOrder={handleUnvalidateOrder}
              onToggleReportItem={handleToggleReportItem}
              onToggleOrderItem={handleToggleOrderItem}
            />
          )}
          {!loading && currentView === View.DELIVERIES && <Deliveries orders={orders} onMarkDelivered={handleMarkItemDelivered} />}
          {!loading && currentView === View.CUSTOMERS && <Customers customers={customers} onSaveCustomer={handleSaveCustomer} onDeleteCustomer={handleDeleteCustomer} />}
          {!loading && currentView === View.LOYALTY && (
            <Loyalty
              customers={customers}
              pointsConfig={pointsConfig}
              onUpdatePointsConfig={setPointsConfig}
              onManualAddPoints={handleManualAddPoints}
              onRedeemReward={handleRedeemReward}
            />
          )}
          {!loading && currentView === View.INVENTORY && (
            <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />
          )}
          {!loading && currentView === View.EXPENSES && <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} currentUser="Admin" />}
          {!loading && currentView === View.SETTINGS && (
            <Settings
              volunteers={availableVolunteers}
              services={availableServices}
              admins={admins}
              pointsConfig={pointsConfig}
              pointsValue={pointsValue}
              onUpdatePointsConfig={setPointsConfig}
              onUpdatePointsValue={setPointsValue}
              onAddVolunteer={addVolunteer}
              onRemoveVolunteer={removeVolunteer}
              onAddService={addService}
              onRemoveService={removeService}
              onAddAdmin={addAdmin}
              onRemoveAdmin={removeAdmin}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (SELETOR DE UNIDADE) ---
const App: React.FC = () => {
  const [units, setUnits] = useState<RegionalUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<RegionalUnit | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const fetchUnits = async () => {
      setLoadingUnits(true);
      const { data, error } = await supabase.from('units').select('*');
      if (data) setUnits(data as any);
      if (error) console.error('Erro ao buscar regionais:', error.message);
      setLoadingUnits(false);
    };
    fetchUnits();

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const [loginModalUnit, setLoginModalUnit] = useState<RegionalUnit | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitPass, setNewUnitPass] = useState('');

  const handleConfirmLogin = () => {
    if (loginModalUnit && loginPassword === loginModalUnit.password) {
      setSelectedUnit(loginModalUnit);
      setLoginModalUnit(null);
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleCreateUnit = async () => {
    if (!newUnitName || !newUnitPass) {
      alert('Preencha todos os campos!');
      return;
    }
    const newId = newUnitName.toLowerCase().replace(/\s+/g, '_');

    const { data, error } = await supabase
      .from('units')
      .insert([{ id: newId, name: newUnitName, password: newUnitPass, color: 'green' }])
      .select();

    if (error) {
      alert('Erro: ' + error.message);
    } else if (data) {
      setUnits([...units, data[0] as any]);
      setAddModalOpen(false);
      setNewUnitName('');
      setNewUnitPass('');
      alert(`Regional ${newUnitName} criada com sucesso!`);
    }
  };

  const handleDeleteUnit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const senha = window.prompt('Para confirmar, digite a senha MESTRE para apagar:');
    if (senha === '123') {
      await supabase.from('units').delete().eq('id', id);
      setUnits(prev => prev.filter(u => u.id !== id));
    } else if (senha) {
      alert('Senha incorreta.');
    }
  };

  if (selectedUnit) {
    return <StoreSystem key={selectedUnit.id} unitId={selectedUnit.id} unitName={selectedUnit.name} onLogoutUnit={() => setSelectedUnit(null)} />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black"></div>

      <div className="relative z-10 w-full max-w-5xl text-center">
        <div className="mb-12 animate-fade-in-up">
          <img
            src="/logo.png"
            alt="Sara Store"
            className="w-32 h-32 object-contain mx-auto mb-6 drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]"
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            SARA <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">REGIONAL</span>
          </h1>
          <p className="text-zinc-400 text-lg mb-6">Selecione sua unidade para acessar o sistema</p>

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="bg-zinc-800 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 mx-auto hover:bg-green-600 transition-all shadow-lg animate-bounce"
            >
              <Download size={16} /> Instalar Aplicativo
            </button>
          )}
        </div>

        {loadingUnits ? (
          <div className="flex flex-col items-center gap-2 text-zinc-500 animate-pulse">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Buscando unidades...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {units.map(unit => (
              <button
                key={unit.id}
                onClick={() => {
                  setLoginModalUnit(unit);
                  setLoginPassword('');
                }}
                className="group relative bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-xl border border-zinc-800 hover:border-green-500/50 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-900/20 flex flex-col items-center gap-4 text-left"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    onClick={e => handleDeleteUnit(e, unit.id)}
                    className="p-2 hover:bg-red-500/20 text-zinc-600 hover:text-red-500 rounded-full transition-colors"
                  >
                    <Trash2 size={14} />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-zinc-950 border border-zinc-800 group-hover:border-green-500 group-hover:text-green-400 transition-colors shadow-lg">
                  <MapPin size={20} className="text-zinc-500 group-hover:text-green-500 transition-colors" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-lg group-hover:text-green-400 transition-colors">{unit.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Lock size={10} className="text-zinc-600 group-hover:text-green-600" />
                    <p className="text-zinc-600 text-xs font-medium uppercase tracking-wider group-hover:text-zinc-400">Protegido</p>
                  </div>
                </div>
              </button>
            ))}
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
        )}
      </div>

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
              <button onClick={() => setLoginModalUnit(null)} className="flex-1 py-3 text-zinc-500 hover:text-white font-bold transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirmLogin} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-colors">
                Acessar
              </button>
            </div>
          </div>
        </div>
      )}

      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden animate-fade-in">
            <button onClick={() => setAddModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-center gap-2">
              <Plus size={20} className="text-green-500" /> Nova Regional
            </h2>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nome da Regional</label>
                <input
                  value={newUnitName}
                  onChange={e => setNewUnitName(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
                  placeholder="Ex: Bangu"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Senha de Acesso</label>
                <input
                  type="password"
                  value={newUnitPass}
                  onChange={e => setNewUnitPass(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
                  placeholder="Crie uma senha segura"
                />
              </div>
              <button onClick={handleCreateUnit} className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors mt-2">
                Criar Unidade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
