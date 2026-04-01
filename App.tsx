import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  Product, Transaction, DailyReport, OrderSheet, AdminUser,
  Customer, Expense, VolunteerSchedule as VolunteerScheduleItem,
} from './types';
import { Dashboard } from './components/Dashboard';
import { VolunteerSales } from './components/VolunteerSales';
import { ReportValidation } from './components/ReportValidation';
import { Orders } from './components/Orders';
import { Inventory } from './components/Inventory';
import { Settings } from './components/Settings';
import { Deliveries } from './components/Deliveries';
import { VolunteerSchedule } from './components/VolunteerSchedule';
import { Loyalty } from './components/Loyalty';
import { Customers } from './components/Customers';
import { Expenses } from './components/Expenses';
import {
  LayoutDashboard, Package, Menu, CheckCircle, ShoppingBag,
  Settings as SettingsIcon, Lock, LogOut, Truck, Star, Users,
  TrendingDown, Store, ChevronRight, MapPin, Plus, X, Trash2,
  Download, CalendarDays, Loader2,
} from 'lucide-react';

// =====================================================
// TIPOS
// =====================================================
interface RegionalUnit { id: string; name: string; color: string; }

enum View {
  DASHBOARD, VOLUNTEER_REPORT, VOLUNTEER_SCHEDULE, ORDERS,
  VALIDATION, INVENTORY, SETTINGS, DELIVERIES, LOYALTY, CUSTOMERS, EXPENSES
}

// =====================================================
// HELPERS
// =====================================================
const digitsOnly = (v: any) => String(v ?? '').replace(/\D/g, '');
const safeNum = (v: any, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };

const extractPhoneFromAny = (obj: any): string => {
  if (!obj) return '';
  return digitsOnly(obj.phone) || digitsOnly(obj.customerPhone) || digitsOnly(obj.customer_phone) || '';
};

const looksLikeUUID = (s: any) => typeof s === 'string' && s.includes('-') && s.length >= 20;

const normalizeCustomerRow = (row: any): Customer => ({
  ...row,
  totalSpent: row.totalSpent ?? row.total_spent ?? 0,
  lastPurchase: row.lastPurchase ?? row.last_purchase ?? row.updated_at ?? row.created_at ?? new Date().toISOString(),
  points: row.points ?? 0,
  phone: row.phone ?? row.telefone ?? '',
});

const DEFAULT_VOLUNTEERS = ['Voluntário 1', 'Voluntário 2'];
const DEFAULT_SERVICES   = ['Culto da Família', 'Arena Jovem', 'Domingo'];
const DEFAULT_POINTS_CONFIG: Record<string, number> = {
  'Livros e Bíblias': 15, 'Vestuário': 30, 'Papelaria': 5, 'Acessórios': 5, 'Outros': 1,
};

// =====================================================
// STORE SYSTEM
// =====================================================
const StoreSystem: React.FC<{ unitId: string; unitName: string; onLogoutUnit: () => void }> = ({
  unitId, unitName, onLogoutUnit,
}) => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);

  const [products,   setProducts]   = useState<Product[]>([]);
  const [reports,    setReports]    = useState<DailyReport[]>([]);
  const [orders,     setOrders]     = useState<OrderSheet[]>([]);
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [schedules,  setSchedules]  = useState<VolunteerScheduleItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // ✅ Configurações persistidas no Supabase
  const [pointsConfig, setPointsConfigState] = useState<Record<string, number>>(DEFAULT_POINTS_CONFIG);
  const [pointsValue,  setPointsValueState]  = useState<number>(0.1);
  const [availableVolunteers, setAvailableVolunteersState] = useState<string[]>(DEFAULT_VOLUNTEERS);
  const [availableServices,   setAvailableServicesState]   = useState<string[]>(DEFAULT_SERVICES);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Auth via Supabase Auth
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // =====================================================
  // FETCH
  // =====================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: prodData },
        { data: custData },
        { data: repData  },
        { data: ordData  },
        { data: expData  },
        { data: scheduleData },
        { data: settingsData },
        { data: adminsData   },
      ] = await Promise.all([
        supabase.from('products').select('*').eq('unit_id', unitId),
        supabase.from('customers').select('*').eq('unit_id', unitId),
        supabase.from('reports').select('*').eq('unit_id', unitId).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('unit_id', unitId).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('unit_id', unitId).order('created_at', { ascending: false }),
        supabase.from('volunteer_schedules').select('*').eq('unit_id', unitId).order('date', { ascending: true }),
        supabase.from('unit_settings').select('*').eq('unit_id', unitId).maybeSingle(),
        supabase.from('app_admins').select('*').eq('unit_id', unitId),
      ]);

      if (prodData)     setProducts(prodData as any);
      if (custData)     setCustomers((custData as any[]).map(normalizeCustomerRow));
      if (repData)      setReports(repData as any);
      if (ordData)      setOrders(ordData as any);
      if (expData)      setExpenses(expData as any);
      if (scheduleData) setSchedules(scheduleData as VolunteerScheduleItem[]);
      if (adminsData)   setAdmins(adminsData as AdminUser[]);

      // ✅ Configurações persistidas
      if (settingsData) {
        if (settingsData.volunteers?.length)    setAvailableVolunteersState(settingsData.volunteers);
        if (settingsData.services?.length)      setAvailableServicesState(settingsData.services);
        if (settingsData.points_config)         setPointsConfigState(settingsData.points_config);
        if (settingsData.points_value != null)  setPointsValueState(settingsData.points_value);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // =====================================================
  // TRANSAÇÕES DERIVADAS (com custo real)
  // =====================================================
  useEffect(() => {
    const calcCost = (items: any[]) => (items || []).reduce((acc: number, item: any) => {
      const prod = products.find((p: any) => p.name === item.productName);
      const cost = safeNum(prod?.costPrice ?? (prod as any)?.cost_price, 0);
      return acc + cost * safeNum(item.quantity, 1);
    }, 0);

    const txReports: Transaction[] = reports
      .filter((r: any) => r.status === 'VALIDADO')
      .map((r: any) => ({ id: r.id, date: r.date, total: r.grandTotal, totalCost: calcCost(r.items), paymentMethod: 'Dinheiro', items: r.items, volunteerName: r.volunteerName, serviceType: r.serviceType }));

    const txOrders: Transaction[] = orders
      .filter((o: any) => o.status === 'ENTREGUE')
      .map((o: any) => ({ id: o.id, date: o.date, total: o.grandTotal, totalCost: calcCost(o.items), paymentMethod: 'Dinheiro', items: o.items, volunteerName: o.volunteerName, serviceType: o.serviceType }));

    setTransactions([...txReports, ...txOrders]);
  }, [reports, orders, products]);

  // =====================================================
  // PERSISTIR CONFIGURAÇÕES
  // =====================================================
  const persistSettings = useCallback(async (
    volunteers: string[], services: string[],
    config: Record<string, number>, value: number,
  ) => {
    await supabase.rpc('upsert_unit_settings', {
      p_unit_id: unitId, p_volunteers: volunteers, p_services: services,
      p_points_config: config, p_points_value: value,
    });
  }, [unitId]);

  const setAvailableVolunteers = async (v: string[]) => { setAvailableVolunteersState(v); await persistSettings(v, availableServices, pointsConfig, pointsValue); };
  const setAvailableServices   = async (s: string[]) => { setAvailableServicesState(s); await persistSettings(availableVolunteers, s, pointsConfig, pointsValue); };
  const setPointsConfig = async (c: Record<string, number>) => { setPointsConfigState(c); await persistSettings(availableVolunteers, availableServices, c, pointsValue); };
  const setPointsValue  = async (v: number) => { setPointsValueState(v); await persistSettings(availableVolunteers, availableServices, pointsConfig, v); };

  // =====================================================
  // AUTH — SUPABASE AUTH
  // =====================================================
  const handleDashboardLogin = async () => {
    setIsLoadingLogin(true); setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
      if (error) { setLoginError('Email ou senha incorretos.'); return; }

      const { data: adminRecord } = await supabase.from('app_admins').select('*').eq('unit_id', unitId).maybeSingle();
      if (!adminRecord) {
        setLoginError('Sem permissão para esta unidade.');
        await supabase.auth.signOut(); return;
      }
      setIsAdminAuthenticated(true); setLoginEmail(''); setLoginPass('');
    } catch { setLoginError('Erro ao fazer login.'); }
    finally { setIsLoadingLogin(false); }
  };

  const handleLockDashboard = async () => { await supabase.auth.signOut(); setIsAdminAuthenticated(false); };

  // =====================================================
  // FIDELIDADE
  // =====================================================
  const ensureCustomerByPhone = async (phoneRaw: string, nameRaw?: string) => {
    const phone = digitsOnly(phoneRaw); if (!phone) return null;
    const existing = customers.find(c => digitsOnly(c.phone) === phone);
    if (existing) return existing;
    const name = String(nameRaw ?? '').trim() || `Cliente ${phone.slice(-4)}`;
    const { data, error } = await supabase.from('customers').insert([{ unit_id: unitId, phone, name, points: 0, totalSpent: 0, lastPurchase: new Date().toISOString() }]).select().single();
    if (error || !data) return null;
    const normalized = normalizeCustomerRow(data);
    setCustomers(prev => [...prev, normalized]);
    return normalized;
  };

  const resolvePhone = (identifier: string) => {
    const asDigits = digitsOnly(identifier);
    if (asDigits) return { phone: asDigits, customer: customers.find(c => digitsOnly(c.phone) === asDigits) ?? null };
    const byId = customers.find(c => String(c.id) === String(identifier));
    return { phone: digitsOnly(byId?.phone ?? ''), customer: byId ?? null };
  };

  const updateCustomerPoints = async (identifier: string, delta: number, extra?: { addSpent?: number; lastPurchase?: string; historyEntry?: { description: string; value: number } }) => {
    const { phone } = resolvePhone(identifier); if (!phone) return;
    let cust = customers.find(c => digitsOnly(c.phone) === phone) ?? null;
    if (!cust) cust = await ensureCustomerByPhone(phone);
    if (!cust) return;

    const newPoints  = safeNum(cust.points, 0) + delta;
    const newSpent   = safeNum(cust.totalSpent, 0) + safeNum(extra?.addSpent, 0);
    const lastPurchase = extra?.lastPurchase || new Date().toISOString();

    const { error } = await supabase.from('customers').update({ points: newPoints, totalSpent: newSpent, lastPurchase }).eq('id', cust.id);
    if (error) { alert('Erro ao atualizar pontos: ' + error.message); return; }

    setCustomers(prev => prev.map(c => String(c.id) === String(cust!.id) ? { ...c, points: newPoints, totalSpent: newSpent, lastPurchase } : c));

    if (extra?.historyEntry && delta > 0) {
      await supabase.from('customer_history').insert([{
        customer_id: cust.id, unit_id: unitId, date: lastPurchase,
        description: extra.historyEntry.description, value: extra.historyEntry.value, points_earned: Math.max(0, delta),
      }]);
    }
  };

  const computePointsFromItems = (items: any[]) => {
    let total = 0;
    for (const it of items || []) {
      const qty = Math.max(1, Math.trunc(safeNum(it.quantity, 1)));
      const cat = String(it.category ?? it.productCategory ?? it.product_category ?? '');
      total += safeNum(pointsConfig[cat], 0) * qty;
    }
    return Math.max(0, Math.trunc(total));
  };

  const extractIdentifierFromReport = (rep: any) => extractPhoneFromAny(rep) || extractPhoneFromAny(rep?.customer) || String(rep?.customerId ?? rep?.customer_id ?? '');

  // =====================================================
  // CRUD — PRODUTOS
  // =====================================================
  const handleAddProduct    = async (prod: Product) => { const { id, ...np } = prod as any; const { data, error } = await supabase.from('products').insert([{ ...np, unit_id: unitId }]).select().single(); if (data) setProducts(prev => [data as any, ...prev]); if (error) alert('Erro: ' + error.message); };
  const handleUpdateProduct = async (prod: Product) => { const { error } = await supabase.from('products').update(prod as any).eq('id', (prod as any).id); if (!error) setProducts(prev => prev.map(p => (p as any).id === (prod as any).id ? prod : p)); else alert('Erro: ' + error.message); };
  const handleDeleteProduct = async (id: string)  => { const { error } = await supabase.from('products').delete().eq('id', id); if (!error) setProducts(prev => prev.filter(p => (p as any).id !== id)); };

  // =====================================================
  // CRUD — RELATÓRIOS
  // =====================================================
  const handleReportSubmit = async (d: any) => {
    const { data, error } = await supabase.from('reports').insert([{ ...d, unit_id: unitId, status: 'PENDENTE' }]).select().single();
    if (data) { setReports(prev => [data as any, ...prev]); const phone = extractPhoneFromAny(d); if (phone) await ensureCustomerByPhone(phone, d?.customerName); alert('Venda enviada para validação!'); }
    if (error) alert('Erro: ' + error.message);
  };

  const handleValidateReport = async (id: string, admin: string) => {
    const { error } = await supabase.from('reports').update({ status: 'VALIDADO', validated_by: admin }).eq('id', id);
    if (error) return alert('Erro ao validar: ' + error.message);

    const rep = reports.find((r: any) => String(r.id) === String(id)) as any;
    if (!rep) return;
    setReports(prev => prev.map((r: any) => String(r.id) === String(id) ? { ...r, status: 'VALIDADO', validatedBy: admin } : r));

    for (const item of rep.items || []) {
      const product = products.find((p: any) => p.name === item.productName);
      if (product) {
        const newStock = safeNum((product as any).stock, 0) - safeNum(item.quantity, 0);
        await supabase.from('products').update({ stock: newStock }).eq('id', (product as any).id);
        setProducts(prev => prev.map(p => (p as any).id === (product as any).id ? { ...p, stock: newStock } : p));
      }
    }

    const identifier = extractIdentifierFromReport(rep);
    if (!identifier) return;

    const phoneForEnsure = looksLikeUUID(identifier)
      ? digitsOnly(customers.find(c => String(c.id) === identifier)?.phone)
      : digitsOnly(identifier);
    if (phoneForEnsure) await ensureCustomerByPhone(phoneForEnsure, rep?.customerName);

    const earned = computePointsFromItems(rep.items || []);
    if (earned > 0) await updateCustomerPoints(identifier, earned, {
      addSpent: safeNum(rep.grandTotal, 0),
      lastPurchase: rep.date ? new Date(rep.date).toISOString() : new Date().toISOString(),
      historyEntry: { description: `Venda validada — ${rep.serviceType ?? 'Balcão'}`, value: safeNum(rep.grandTotal, 0) },
    });
  };

  // ✅ Handler implementado — reverte estoque
  const handleUnvalidateReport = async (id: string) => {
    const rep = reports.find((r: any) => String(r.id) === String(id)) as any;
    if (!rep || rep.status !== 'VALIDADO') return;

    const { error } = await supabase.from('reports').update({ status: 'DESVALIDADO', validated_by: null }).eq('id', id);
    if (error) return alert('Erro ao desvalidar: ' + error.message);

    for (const item of rep.items || []) {
      const product = products.find((p: any) => p.name === item.productName);
      if (product) {
        const newStock = safeNum((product as any).stock, 0) + safeNum(item.quantity, 0);
        await supabase.from('products').update({ stock: newStock }).eq('id', (product as any).id);
        setProducts(prev => prev.map(p => (p as any).id === (product as any).id ? { ...p, stock: newStock } : p));
      }
    }

    setReports(prev => prev.map((r: any) => String(r.id) === String(id) ? { ...r, status: 'DESVALIDADO', validatedBy: null } : r));
    alert('Relatório desvalidado. Estoque revertido.');
  };

  // ✅ Handler implementado — toggle com persistência
  const handleToggleReportItem = async (id: string, idx: number) => {
    const rep = reports.find((r: any) => String(r.id) === String(id)) as any; if (!rep) return;
    const updatedItems = (rep.items || []).map((item: any, i: number) => i === idx ? { ...item, checked: !item.checked } : item);
    const { error } = await supabase.from('reports').update({ items: updatedItems }).eq('id', id);
    if (error) return alert('Erro ao atualizar item: ' + error.message);
    setReports(prev => prev.map((r: any) => String(r.id) === String(id) ? { ...r, items: updatedItems } : r));
  };

  // =====================================================
  // CRUD — ENCOMENDAS
  // =====================================================
  const handleOrderSubmit = async (d: any) => {
    const { data, error } = await supabase.from('orders').insert([{ ...d, unit_id: unitId, status: 'PENDENTE' }]).select().single();
    if (data) { setOrders(prev => [data as any, ...prev]); alert('Encomenda registrada!'); }
    if (error) alert('Erro: ' + error.message);
  };

  const handleValidateOrder = async (id: string, admin: string) => {
    const { error } = await supabase.from('orders').update({ status: 'ENTREGUE', validated_by: admin }).eq('id', id);
    if (error) return alert('Erro: ' + error.message);
    setOrders(prev => prev.map((o: any) => String(o.id) === String(id) ? { ...o, status: 'ENTREGUE', validatedBy: admin } : o));
    alert('Encomenda entregue!');
  };

  // ✅ Handler implementado
  const handleUnvalidateOrder = async (id: string) => {
    const { error } = await supabase.from('orders').update({ status: 'DESVALIDADO', validated_by: null }).eq('id', id);
    if (error) return alert('Erro ao desvalidar encomenda: ' + error.message);
    setOrders(prev => prev.map((o: any) => String(o.id) === String(id) ? { ...o, status: 'DESVALIDADO', validatedBy: null } : o));
    alert('Encomenda desvalidada.');
  };

  // ✅ Handler implementado
  const handleToggleOrderItem = async (id: string, idx: number) => {
    const ord = orders.find((o: any) => String(o.id) === String(id)) as any; if (!ord) return;
    const updatedItems = (ord.items || []).map((item: any, i: number) => i === idx ? { ...item, checked: !item.checked } : item);
    const { error } = await supabase.from('orders').update({ items: updatedItems }).eq('id', id);
    if (error) return alert('Erro ao atualizar item: ' + error.message);
    setOrders(prev => prev.map((o: any) => String(o.id) === String(id) ? { ...o, items: updatedItems } : o));
  };

  const handleMarkItemDelivered = async (orderId: string, itemId: string) => {
    const order = orders.find((o: any) => String(o.id) === String(orderId)) as any; if (!order) return;
    const now = new Date().toISOString();
    const updatedItems = (order.items || []).map((it: any, idx: number) => {
      const itKey = String(it?.id ?? it?.itemId ?? it?.productId ?? `${orderId}-${idx}`);
      const match = String(it?.id) === String(itemId) || String(it?.itemId) === String(itemId) || String(itKey) === String(itemId);
      return match ? { ...it, delivered: true, deliveredAt: it.deliveredAt ?? now } : it;
    });
    const { error } = await supabase.from('orders').update({ items: updatedItems }).eq('id', orderId);
    if (error) return alert('Erro: ' + error.message);
    setOrders(prev => prev.map((o: any) => String(o.id) === String(orderId) ? { ...o, items: updatedItems } : o));
  };

  // =====================================================
  // CRUD — DESPESAS, CLIENTES, ESCALAS
  // =====================================================
  const handleAddExpense    = async (e: Expense) => { const { data, error } = await supabase.from('expenses').insert([{ ...(e as any), unit_id: unitId }]).select().single(); if (data) setExpenses(prev => [data as any, ...prev]); if (error) alert('Erro: ' + error.message); };
  const handleDeleteExpense = async (id: string)  => { const { error } = await supabase.from('expenses').delete().eq('id', id); if (!error) setExpenses(prev => prev.filter((e: any) => (e as any).id !== id)); };

  const handleSaveCustomer = async (c: Customer) => {
    const phone = digitsOnly(c.phone);
    const existing = customers.find(cu => digitsOnly(cu.phone) === phone);
    if (existing) {
      const { error } = await supabase.from('customers').update(c as any).eq('id', (existing as any).id);
      if (!error) setCustomers(prev => prev.map(x => (x as any).id === (existing as any).id ? { ...x, ...c } : x));
    } else {
      const { id, ...nc } = c as any;
      const { data, error } = await supabase.from('customers').insert([{ ...nc, unit_id: unitId }]).select().single();
      if (data) setCustomers(prev => [...prev, normalizeCustomerRow(data)]);
      if (error) alert('Erro: ' + error.message);
    }
  };
  const handleDeleteCustomer = async (id: string) => { await supabase.from('customers').delete().eq('id', id); setCustomers(prev => prev.filter(x => String((x as any).id) !== String(id))); };

  const handleAddSchedule    = async (payload: Omit<VolunteerScheduleItem, 'id'>) => { const { data, error } = await supabase.from('volunteer_schedules').insert([{ ...payload, unit_id: unitId }]).select().single(); if (error) return alert('Erro: ' + error.message); setSchedules(prev => [...prev, data as VolunteerScheduleItem]); alert('Adicionado à escala!'); };
  const handleDeleteSchedule = async (id: string) => { const { error } = await supabase.from('volunteer_schedules').delete().eq('id', id); if (error) return alert('Erro: ' + error.message); setSchedules(prev => prev.filter(item => item.id !== id)); };

  const handleManualAddPoints = async (identifier: string, points: number) => { const p = Math.trunc(safeNum(points, 0)); if (!p) return; await updateCustomerPoints(identifier, p, { historyEntry: { description: 'Pontos adicionados manualmente', value: 0 } }); };
  const handleRedeemReward    = async (identifier: string, cost: number) => { const c = Math.max(0, Math.trunc(safeNum(cost, 0))); if (!c) return; const { phone } = resolvePhone(identifier); if (!phone) return; const cust = customers.find(x => digitsOnly(x.phone) === phone); if (!cust) return; if (safeNum(cust.points, 0) < c) return alert('Saldo insuficiente.'); await updateCustomerPoints(identifier, -c, { historyEntry: { description: 'Resgate de recompensa', value: 0 } }); };

  const addAdmin    = async (a: { name: string; email: string; password: string }) => { const { data, error } = await supabase.from('app_admins').insert([{ unit_id: unitId, name: a.name, email: a.email, role: 'admin' }]).select().single(); if (data) setAdmins(prev => [...prev, data as AdminUser]); if (error) alert('Erro ao adicionar admin: ' + error.message); };
  const removeAdmin = async (id: string) => { await supabase.from('app_admins').delete().eq('id', id); setAdmins(prev => prev.filter((a: any) => (a as any).id !== id)); };

  const addVolunteer    = (n: string) => setAvailableVolunteers([...availableVolunteers, n]);
  const removeVolunteer = (n: string) => setAvailableVolunteers(availableVolunteers.filter(v => v !== n));
  const addService      = (s: string) => setAvailableServices([...availableServices, s]);
  const removeService   = (s: string) => setAvailableServices(availableServices.filter(x => x !== s));

  const pendingCount = reports.filter((r: any) => r.status === 'PENDENTE').length + orders.filter((o: any) => o.status === 'PENDENTE').length;

  // =====================================================
  // NAV
  // =====================================================
  const NavItem = ({ view, icon: Icon, label, badge }: any) => {
    const active = currentView === view;
    return (
      <button onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}
        className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm mx-1 ${active ? 'bg-gradient-to-r from-zinc-900 to-transparent text-white border-l-2 border-green-500' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'}`}>
        <div className="flex items-center gap-3">
          <Icon size={18} className={`transition-colors ${active ? 'text-green-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
          <span>{label}</span>
        </div>
        {badge > 0 && <span className="bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">{badge}</span>}
        {active && <ChevronRight size={14} className="text-zinc-700" />}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="space-y-8 mt-4">
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-4">Operacional</p>
        <div className="space-y-1">
          <NavItem view={View.VOLUNTEER_REPORT}  icon={Store}      label="Venda Balcão" />
          <NavItem view={View.VOLUNTEER_SCHEDULE} icon={CalendarDays} label="Escala" />
          <NavItem view={View.ORDERS}            icon={ShoppingBag} label="Encomendas" />
          <NavItem view={View.CUSTOMERS}         icon={Users}       label="Clientes" />
          <NavItem view={View.INVENTORY}         icon={Package}     label="Estoque" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-4">Gestão</p>
        <div className="space-y-1">
          <NavItem view={View.DASHBOARD}   icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={View.VALIDATION}  icon={CheckCircle}     label="Validações" badge={pendingCount} />
          <NavItem view={View.EXPENSES}    icon={TrendingDown}    label="Saídas / Despesas" />
          <NavItem view={View.DELIVERIES}  icon={Truck}           label="Logística" />
          <NavItem view={View.LOYALTY}     icon={Star}            label="Fidelidade" />
        </div>
      </div>
      <div className="pt-4 border-t border-zinc-900/50">
        <NavItem view={View.SETTINGS} icon={SettingsIcon} label="Configurações" />
      </div>
    </div>
  );

  const DashboardLogin = () => (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="bg-zinc-900/80 p-10 rounded-3xl border border-white/10 max-w-sm w-full text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        <Lock size={30} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Área Restrita</h2>
        <p className="text-zinc-500 text-xs mb-6">Acesso ao Dashboard e Gestão</p>
        <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 mb-3 text-white focus:border-green-500 outline-none transition-all" placeholder="Email" type="email" />
        <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDashboardLogin()} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 mb-3 text-white focus:border-green-500 outline-none transition-all" placeholder="Senha" />
        {loginError && <p className="text-red-400 text-xs mb-4">{loginError}</p>}
        <button onClick={handleDashboardLogin} disabled={isLoadingLogin} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          {isLoadingLogin ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : 'Acessar'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 font-sans selection:bg-green-500/30 selection:text-green-200">

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-black/40 border-r border-white/5 p-4 fixed h-full z-20 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-6 pt-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-green-500/20 blur-[60px] rounded-full pointer-events-none" />
          <img src="/logo.png" alt="Sara Store" className="w-40 h-40 object-contain drop-shadow-2xl relative z-10 transition-transform hover:scale-105 duration-500" onError={e => { e.currentTarget.style.display = 'none'; }} />
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
          <button onClick={onLogoutUnit} className="text-zinc-500 hover:text-red-500 transition-colors" title="Sair da Unidade"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* Header Mobile */}
      <div className="lg:hidden fixed top-0 w-full bg-black/80 backdrop-blur-md z-30 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-10 h-10" alt="Logo" />
          <div className="flex flex-col"><span className="font-bold text-sm tracking-widest text-white">SARA STORE</span><span className="text-[9px] text-green-500 font-bold uppercase">{unitName}</span></div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400"><Menu size={24} /></button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-zinc-950 w-3/4 h-full p-6 border-r border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}><SidebarContent /></div>
        </div>
      )}

      <main className="flex-1 lg:ml-72 p-4 lg:p-10 pt-24 lg:pt-10 transition-all min-h-screen relative">
        <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
          {loading ? (
            <div className="flex items-center justify-center h-[50vh] flex-col gap-4">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm animate-pulse">Carregando dados da nuvem...</p>
            </div>
          ) : (
            <>
              {currentView === View.DASHBOARD && (!isAdminAuthenticated ? <DashboardLogin /> : (
                <div className="relative">
                  <div className="absolute top-0 right-0 z-10">
                    <button onClick={handleLockDashboard} className="bg-black/40 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/5 hover:bg-white/5 transition-all"><LogOut size={14} /> Bloquear</button>
                  </div>
                  <Dashboard transactions={transactions} products={products} expenses={expenses} schedules={schedules} />
                </div>
              ))}
              {currentView === View.VOLUNTEER_REPORT  && <VolunteerSales products={products} onSubmitReport={handleReportSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} customers={customers} pointsValue={pointsValue} />}
              {currentView === View.VOLUNTEER_SCHEDULE && <VolunteerSchedule schedules={schedules} availableVolunteers={availableVolunteers} availableServices={availableServices} onAddSchedule={handleAddSchedule} onDeleteSchedule={handleDeleteSchedule} />}
              {currentView === View.ORDERS      && <Orders products={products} onSubmitOrders={handleOrderSubmit} availableVolunteers={availableVolunteers} availableServices={availableServices} />}
              {currentView === View.VALIDATION  && <ReportValidation reports={reports} orders={orders} admins={admins} onValidateReport={handleValidateReport} onValidateOrder={handleValidateOrder} onUnvalidateReport={handleUnvalidateReport} onUnvalidateOrder={handleUnvalidateOrder} onToggleReportItem={handleToggleReportItem} onToggleOrderItem={handleToggleOrderItem} />}
              {currentView === View.DELIVERIES  && <Deliveries orders={orders} onMarkDelivered={handleMarkItemDelivered} />}
              {currentView === View.CUSTOMERS   && <Customers customers={customers} onSaveCustomer={handleSaveCustomer} onDeleteCustomer={handleDeleteCustomer} />}
              {currentView === View.LOYALTY     && <Loyalty customers={customers} pointsConfig={pointsConfig} onUpdatePointsConfig={setPointsConfig} onManualAddPoints={handleManualAddPoints} onRedeemReward={handleRedeemReward} />}
              {currentView === View.INVENTORY   && <Inventory products={products} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />}
              {currentView === View.EXPENSES    && <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} currentUser="Admin" />}
              {currentView === View.SETTINGS    && <Settings volunteers={availableVolunteers} services={availableServices} admins={admins} pointsConfig={pointsConfig} pointsValue={pointsValue} onUpdatePointsConfig={setPointsConfig} onUpdatePointsValue={setPointsValue} onAddVolunteer={addVolunteer} onRemoveVolunteer={removeVolunteer} onAddService={addService} onRemoveService={removeService} onAddAdmin={addAdmin} onRemoveAdmin={removeAdmin} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// =====================================================
// APP — SELETOR DE UNIDADE
// =====================================================
const App: React.FC = () => {
  const [units, setUnits] = useState<RegionalUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<RegionalUnit | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [unitPasswordInput, setUnitPasswordInput] = useState('');
  const [unitLoginError,    setUnitLoginError]    = useState('');
  const [pendingUnit,       setPendingUnit]       = useState<RegionalUnit | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingUnits(true);
      const { data, error } = await supabase.from('units').select('*');
      if (data) setUnits(data as any);
      if (error) console.error(error.message);
      setLoadingUnits(false);
    })();
    window.addEventListener('beforeinstallprompt', (e: any) => { e.preventDefault(); setDeferredPrompt(e); });
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => setDeferredPrompt(null)); }
  };

  // ✅ Verificação de senha via RPC do Supabase (bcrypt no banco)
  const handleUnitLogin = async () => {
    if (!pendingUnit) return;
    setIsCheckingPassword(true); setUnitLoginError('');
    try {
      const { data, error } = await supabase.rpc('verify_unit_password', { p_unit_id: pendingUnit.id, p_password: unitPasswordInput });
      if (error || !data) { setUnitLoginError('Senha incorreta. Tente novamente.'); return; }
      setSelectedUnit(pendingUnit); setPendingUnit(null); setUnitPasswordInput('');
    } catch { setUnitLoginError('Erro ao verificar senha.'); }
    finally { setIsCheckingPassword(false); }
  };

  if (selectedUnit) return <StoreSystem unitId={selectedUnit.id} unitName={selectedUnit.name} onLogoutUnit={() => setSelectedUnit(null)} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="Sara Store" className="w-32 h-32 mx-auto mb-4 drop-shadow-2xl" />
        <h1 className="text-3xl font-black tracking-widest text-white">SARA STORE</h1>
        <p className="text-zinc-500 text-sm mt-1">Selecione sua unidade regional</p>
      </div>

      {deferredPrompt && (
        <button onClick={handleInstallPWA} className="mb-6 flex items-center gap-2 bg-green-600/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-medium hover:bg-green-600/30 transition-all">
          <Download size={14} /> Instalar App
        </button>
      )}

      {loadingUnits ? (
        <div className="flex items-center gap-3 text-zinc-500"><Loader2 size={20} className="animate-spin" /><span>Carregando unidades...</span></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {units.map((unit: any) => (
            <button key={unit.id} onClick={() => setPendingUnit(unit)}
              className="p-6 rounded-2xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/60 transition-all text-left group relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `radial-gradient(circle at 30% 50%, ${unit.color || '#22c55e'}, transparent 70%)` }} />
              <div className="flex items-center gap-3 relative">
                <MapPin size={20} style={{ color: unit.color || '#22c55e' }} />
                <div>
                  <p className="font-bold text-white">{unit.name}</p>
                  <p className="text-xs text-zinc-500">Unidade Regional</p>
                </div>
                <ChevronRight size={16} className="text-zinc-600 ml-auto group-hover:text-white transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {pendingUnit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{pendingUnit.name}</h2>
              <button onClick={() => { setPendingUnit(null); setUnitPasswordInput(''); setUnitLoginError(''); }} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <input type="password" value={unitPasswordInput} onChange={e => setUnitPasswordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnitLogin()} placeholder="Senha da unidade" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 mb-3 text-white focus:border-green-500 outline-none transition-all" autoFocus />
            {unitLoginError && <p className="text-red-400 text-xs mb-4">{unitLoginError}</p>}
            <button onClick={handleUnitLogin} disabled={isCheckingPassword} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {isCheckingPassword ? <Loader2 size={16} className="animate-spin" /> : null} Entrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
