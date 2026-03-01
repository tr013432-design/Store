import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Product, VolunteerSchedule as VolunteerScheduleItem } from '../types';
import { analyzeSales } from '../services/geminiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Target,
  Edit3,
  Check,
  X,
  Lightbulb,
  Church,
  Trophy,
  Zap,
  Diamond
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  schedules?: VolunteerScheduleItem[];
  expenses?: any[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const money = (value: number) =>
  `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date('2000-01-01T12:00:00');

  // Se vier YYYY-MM-DD, força meio-dia pra não “voltar dia” por timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }

  return new Date(dateStr);
};

// Normaliza para não duplicar "Culto da Família" vs "Culto da Familia" vs "CULTO..."
const keyify = (value: string) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ');

const displayName = (value: string) => String(value ?? '').trim();

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  products,
  schedules = []
}) => {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- META ---
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [goals, setGoals] = useState<Record<string, number>>({});

  const monthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-meta`;
  const currentGoal = goals[monthKey] || 0;

  useEffect(() => {
    const savedGoals = localStorage.getItem('sara_store_goals');
    if (savedGoals) setGoals(JSON.parse(savedGoals));
  }, []);

  const handleSaveGoal = () => {
    const value = parseFloat(String(tempGoal).replace(',', '.'));
    if (!isNaN(value) && value >= 0) {
      const newGoals = { ...goals, [monthKey]: value };
      setGoals(newGoals);
      localStorage.setItem('sara_store_goals', JSON.stringify(newGoals));
    }
    setIsEditingGoal(false);
  };

  const startEditing = () => {
    setTempGoal(currentGoal ? String(currentGoal) : '');
    setIsEditingGoal(true);
  };

  // --- NAVEGAÇÃO DE DATA ---
  const prevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  const formattedMonth = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  // --- FILTRO DE MÊS ---
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = parseSafeDate(String(t.date));
      return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  const monthSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const sDate = parseSafeDate(String(s.date));
      return sDate.getMonth() === selectedDate.getMonth() && sDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [schedules, selectedDate]);

  // --- KPI FINANCEIROS ---
  const financialMetrics = useMemo(() => {
    let revenue = 0;
    let cost = 0;

    monthTransactions.forEach((t) => {
      revenue += Number(t.total || 0);
      (t.items || []).forEach((item: any) => {
        const productRef = products.find((p) => p.name === item.productName);
        const unitCost = Number((productRef as any)?.costPrice || 0);
        cost += unitCost * Number(item.quantity || 0);
      });
    });

    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, cost, profit, margin };
  }, [monthTransactions, products]);

  // --- RANKING / GAMIFICAÇÃO (continua por transação) ---
  const volunteerStats = useMemo(() => {
    const stats: Record<string, { revenue: number; count: number }> = {};

    monthTransactions.forEach((t) => {
      const name = displayName(t.volunteerName || 'Não Identificado');
      const k = keyify(name);
      if (!stats[k]) stats[k] = { revenue: 0, count: 0 };
      stats[k].revenue += Number(t.total || 0);
      stats[k].count += 1;
    });

    const list = Object.entries(stats).map(([k, data]) => ({
      name: k, // já normalizado; abaixo eu re-exibo como title-case simples
      revenue: data.revenue,
      count: data.count,
      ticket: data.count > 0 ? data.revenue / data.count : 0
    }));

    // tenta recuperar um nome “bonito” do mês (primeiro que aparecer)
    const prettyMap: Record<string, string> = {};
    monthTransactions.forEach((t) => {
      const n = displayName(t.volunteerName || 'Não Identificado');
      const k = keyify(n);
      if (!prettyMap[k]) prettyMap[k] = n;
    });

    return list
      .map((x) => ({ ...x, name: prettyMap[x.name] || x.name }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [monthTransactions]);

  const awards = useMemo(() => {
    if (volunteerStats.length === 0) return null;

    const topRevenue = volunteerStats[0];
    const topSpeed = [...volunteerStats].sort((a, b) => b.count - a.count)[0];
    const eligibleForTicket = volunteerStats.filter((v) => v.count >= 2);
    const topTicket = eligibleForTicket.length > 0 ? [...eligibleForTicket].sort((a, b) => b.ticket - a.ticket)[0] : volunteerStats[0];

    return { topRevenue, topSpeed, topTicket };
  }, [volunteerStats]);

  // --- META POR CULTO E POR VOLUNTÁRIO (FIX) ---
  // Regra nova: a meta mensal é dividida por "par voluntário+culto" escalado no mês.
  // Se o voluntário estiver em 2 cultos no mês, ele terá 2 metas (1 em cada culto).
  const goalByService = useMemo(() => {
    type VolunteerRow = {
      isScheduled: boolean;         // escalado no mês nesse culto?
      revenue: number;              // faturado no mês nesse culto
      saleCount: number;            // vendas no mês nesse culto
      personalGoal: number;         // meta pessoal desse culto (fix)
    };

    type ServiceRow = {
      serviceKey: string;
      serviceLabel: string;
      scheduledVolunteersKeys: Set<string>;
      volunteers: Record<string, { label: string } & VolunteerRow>;
      serviceGoal: number;
      serviceRevenue: number;
    };

    const serviceMap: Record<string, ServiceRow> = {};

    // 1) Monta a lista de PARES escalados (culto + voluntário) do mês
    const scheduledPairs = new Set<string>();
    const volunteerLabelByKey: Record<string, string> = {};
    const serviceLabelByKey: Record<string, string> = {};

    monthSchedules.forEach((s) => {
      const rawService = displayName((s as any).serviceType || 'Outros');
      const rawVolunteer = displayName((s as any).volunteerName || 'Não Identificado');

      const sKey = keyify(rawService);
      const vKey = keyify(rawVolunteer);

      if (!serviceLabelByKey[sKey]) serviceLabelByKey[sKey] = rawService;
      if (!volunteerLabelByKey[vKey]) volunteerLabelByKey[vKey] = rawVolunteer;

      scheduledPairs.add(`${sKey}||${vKey}`);

      if (!serviceMap[sKey]) {
        serviceMap[sKey] = {
          serviceKey: sKey,
          serviceLabel: serviceLabelByKey[sKey],
          scheduledVolunteersKeys: new Set<string>(),
          volunteers: {},
          serviceGoal: 0,
          serviceRevenue: 0
        };
      }

      serviceMap[sKey].scheduledVolunteersKeys.add(vKey);

      if (!serviceMap[sKey].volunteers[vKey]) {
        serviceMap[sKey].volunteers[vKey] = {
          label: volunteerLabelByKey[vKey],
          isScheduled: true,
          revenue: 0,
          saleCount: 0,
          personalGoal: 0
        };
      } else {
        serviceMap[sKey].volunteers[vKey].isScheduled = true;
      }
    });

    // 2) Injeta as transações (mesmo que não esteja escalado)
    monthTransactions.forEach((t) => {
      const rawService = displayName((t as any).serviceType || 'Outros');
      const rawVolunteer = displayName((t as any).volunteerName || 'Não Identificado');

      const sKey = keyify(rawService);
      const vKey = keyify(rawVolunteer);

      if (!serviceLabelByKey[sKey]) serviceLabelByKey[sKey] = rawService;
      if (!volunteerLabelByKey[vKey]) volunteerLabelByKey[vKey] = rawVolunteer;

      if (!serviceMap[sKey]) {
        serviceMap[sKey] = {
          serviceKey: sKey,
          serviceLabel: serviceLabelByKey[sKey],
          scheduledVolunteersKeys: new Set<string>(),
          volunteers: {},
          serviceGoal: 0,
          serviceRevenue: 0
        };
      }

      if (!serviceMap[sKey].volunteers[vKey]) {
        serviceMap[sKey].volunteers[vKey] = {
          label: volunteerLabelByKey[vKey],
          isScheduled: scheduledPairs.has(`${sKey}||${vKey}`),
          revenue: 0,
          saleCount: 0,
          personalGoal: 0
        };
      }

      serviceMap[sKey].serviceRevenue += Number((t as any).total || 0);
      serviceMap[sKey].volunteers[vKey].revenue += Number((t as any).total || 0);
      serviceMap[sKey].volunteers[vKey].saleCount += 1;
    });

    // 3) Calcula a divisão da meta mensal por par (culto+voluntário) escalado
    const totalPairs = scheduledPairs.size;
    const pairGoal = currentGoal > 0 && totalPairs > 0 ? currentGoal / totalPairs : 0;

    Object.values(serviceMap).forEach((service) => {
      const scheduledVolunteersCount = service.scheduledVolunteersKeys.size;

      // Meta do culto = meta por par * quantidade de voluntários escalados nesse culto
      service.serviceGoal = pairGoal * scheduledVolunteersCount;

      Object.entries(service.volunteers).forEach(([vKey, v]) => {
        const isScheduled = scheduledPairs.has(`${service.serviceKey}||${vKey}`);
        v.personalGoal = isScheduled ? pairGoal : 0;
      });
    });

    // 4) Monta lista final para render
    return Object.values(serviceMap)
      .map((service) => {
        const volunteers = Object.entries(service.volunteers)
          .map(([vKey, v]) => {
            const progress = v.personalGoal > 0 ? (v.revenue / v.personalGoal) * 100 : 0;

            return {
              key: vKey,
              name: v.label,
              isScheduled: v.isScheduled,
              revenue: v.revenue,
              saleCount: v.saleCount,
              goal: v.personalGoal,
              progress
            };
          })
          .sort((a, b) => {
            // primeiro os escalados
            if (a.isScheduled !== b.isScheduled) return a.isScheduled ? -1 : 1;
            // depois por faturamento
            if (b.revenue !== a.revenue) return b.revenue - a.revenue;
            return a.name.localeCompare(b.name);
          });

        const serviceProgress = service.serviceGoal > 0 ? (service.serviceRevenue / service.serviceGoal) * 100 : 0;

        return {
          serviceName: service.serviceLabel,
          scheduledVolunteersCount: service.scheduledVolunteersKeys.size,
          serviceRevenue: service.serviceRevenue,
          serviceGoal: service.serviceGoal,
          serviceProgress,
          volunteers
        };
      })
      .sort((a, b) => b.serviceRevenue - a.serviceRevenue);
  }, [monthSchedules, monthTransactions, currentGoal]);

  // --- OUTROS GRÁFICOS ---
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, revenue: 0 }));
    monthTransactions.forEach((t) => {
      const day = parseSafeDate(String(t.date)).getDate();
      if (data[day - 1]) data[day - 1].revenue += Number(t.total || 0);
    });
    return data;
  }, [monthTransactions, selectedDate]);

  const salesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    monthTransactions.flatMap((t) => t.items || []).forEach((item: any) => {
      const cat = item.category || 'Outros';
      categories[cat] = (categories[cat] || 0) + Number(item.price || 0) * Number(item.quantity || 0);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (monthTransactions.length > 5) {
        setLoading(true);
        const data = await analyzeSales(monthTransactions, products);
        setInsight(data);
        setLoading(false);
      } else {
        setInsight(null);
      }
    };
    fetchInsight();
  }, [monthTransactions, products]);

  const totalGoalProgress = currentGoal > 0 ? Math.min((financialMetrics.revenue / currentGoal) * 100, 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Performance</h2>
          <p className="text-green-500 text-sm mt-1 font-bold tracking-widest uppercase">Visão Mensal</p>
        </div>

        <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 p-1">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 min-w-[200px] justify-center font-bold text-zinc-200 uppercase tracking-wider text-sm">
            <Calendar size={16} className="text-green-500 mb-0.5" />
            <span>{formattedMonth}</span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* KPI FINANCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Receita */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between relative group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Receita Bruta</p>
              <h3 className="text-2xl font-black text-white mt-1">{money(financialMetrics.revenue)}</h3>
            </div>
            <div className="p-3 rounded-xl text-blue-500 bg-blue-500/10">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Target size={12} /> Meta do mês
              </span>

              {isEditingGoal ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-24 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-green-500"
                  />
                  <button onClick={handleSaveGoal} className="p-1 bg-green-600 rounded hover:bg-green-500 text-white">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setIsEditingGoal(false)} className="p-1 bg-zinc-700 rounded hover:bg-zinc-600 text-white">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditing}>
                  <span className="text-xs font-semibold text-zinc-300">{currentGoal > 0 ? money(currentGoal) : 'Definir'}</span>
                  <Edit3 size={12} className="text-zinc-600 group-hover:text-green-500 transition-colors" />
                </div>
              )}
            </div>

            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500" style={{ width: `${totalGoalProgress}%` }} />
            </div>

            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider font-bold">
              <span className="text-zinc-500">{currentGoal > 0 ? `${totalGoalProgress.toFixed(1)}% da meta` : 'Meta não definida'}</span>
              {currentGoal > 0 && <span className="text-zinc-400">Falta {money(Math.max(currentGoal - financialMetrics.revenue, 0))}</span>}
            </div>
          </div>
        </div>

        {/* Lucro */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Lucro Líquido</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{money(financialMetrics.profit)}</h3>
            </div>
            <div className="p-3 rounded-xl text-emerald-500 bg-emerald-500/10">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3 mt-auto flex justify-between items-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Margem Real</p>
            <span className={`text-xs font-bold ${financialMetrics.margin > 20 ? 'text-emerald-400' : 'text-yellow-500'}`}>{financialMetrics.margin.toFixed(1)}%</span>
          </div>
        </div>

        {/* IA */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-2xl border border-zinc-700/50 flex flex-col justify-between relative overflow-hidden group md:col-span-2">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={80} />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/5 p-1.5 rounded-lg backdrop-blur-sm">
              <Sparkles size={16} className="text-green-400" />
            </div>
            <p className="font-bold text-[10px] tracking-widest uppercase text-green-500">IA RGP • Estratégia</p>
          </div>

          <div className="relative z-10 space-y-4">
            {loading ? (
              <div className="flex gap-2 items-center text-sm text-zinc-400">
                <span className="animate-pulse">Analisando margens...</span>
              </div>
            ) : insight ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Diagnóstico</p>
                  <p className="text-sm font-medium leading-relaxed text-zinc-300">"{insight.insight}"</p>
                </div>
                <div className="border-l border-zinc-700 pl-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb size={12} className="text-yellow-500" />
                    <p className="text-[10px] uppercase tracking-wider text-yellow-500 font-bold">Ação Recomendada</p>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-zinc-100">{insight.suggestion || 'Continue vendendo para gerar novas estratégias.'}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">Insira vendas para calcular a margem de lucro ideal.</p>
            )}
          </div>
        </div>
      </div>

      {/* META POR CULTO E POR VOLUNTÁRIO */}
      {currentGoal > 0 && (
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <Church size={20} className="text-green-500" />
                Meta por culto e por voluntário escalado
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                A meta do mês é dividida por <b>voluntário + culto</b> que estiver escalado no mês.
              </p>
            </div>

            <div className="bg-black/40 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Meta mensal definida</p>
              <p className="text-lg font-black text-green-400">{money(currentGoal)}</p>
            </div>
          </div>

          {goalByService.length === 0 ? (
            <div className="text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
              Cadastre a escala do mês para distribuir a meta antes das vendas.
            </div>
          ) : (
            <div className="space-y-6">
              {goalByService.map((service) => (
                <div key={service.serviceName} className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
                    <div>
                      <h4 className="text-white font-black text-lg">{service.serviceName}</h4>
                      <p className="text-zinc-500 text-sm">
                        {service.scheduledVolunteersCount} voluntário(s) escalado(s) no mês • meta do culto:{' '}
                        <span className="text-zinc-300 font-bold">{money(service.serviceGoal)}</span>
                      </p>
                    </div>

                    <div className="min-w-[240px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-500 uppercase tracking-wider font-bold">Progresso do culto</span>
                        <span className="text-white font-bold">{money(service.serviceRevenue)} / {money(service.serviceGoal)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            service.serviceProgress >= 100
                              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                              : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          }`}
                          style={{ width: `${Math.min(service.serviceProgress || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {service.volunteers.map((volunteer) => (
                      <div key={`${service.serviceName}-${volunteer.key}`} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-bold text-sm">{volunteer.name}</p>
                            <p className="text-zinc-500 text-xs mt-1">
                              {volunteer.isScheduled ? 'Escalado' : 'Sem escala'} • {volunteer.saleCount} venda(s)
                            </p>
                          </div>

                          <div
                            className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                              volunteer.goal > 0 && volunteer.progress >= 100
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}
                          >
                            {volunteer.goal > 0 && volunteer.progress >= 100 ? 'Meta batida' : 'Em andamento'}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Faturado</span>
                            <span className="text-white font-bold">{money(volunteer.revenue)}</span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Meta pessoal</span>
                            <span className="text-green-400 font-bold">{money(volunteer.goal)}</span>
                          </div>

                          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                volunteer.goal > 0 && volunteer.progress >= 100
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                  : 'bg-gradient-to-r from-yellow-500 to-orange-400'
                              }`}
                              style={{ width: `${Math.min(volunteer.progress || 0, 100)}%` }}
                            />
                          </div>

                          <div className="text-right text-[11px] font-bold">
                            <span className={volunteer.goal > 0 && volunteer.progress >= 100 ? 'text-emerald-400' : 'text-yellow-400'}>
                              {volunteer.goal > 0 ? `${volunteer.progress.toFixed(1)}%` : '0.0%'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RANKING */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="text-yellow-500" size={24} />
          <h3 className="text-xl font-bold text-white uppercase tracking-wide">Ranking & Premiações</h3>
        </div>

        {awards && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-yellow-900/20 to-zinc-900 p-4 rounded-xl border border-yellow-500/30 flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500"><Trophy size={24} /></div>
              <div>
                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">O Vendedor (Receita)</p>
                <p className="text-lg font-bold text-white">{awards.topRevenue.name}</p>
                <p className="text-xs text-zinc-400">{money(awards.topRevenue.revenue)} vendidos</p>
              </div>
              <div className="absolute -right-4 -bottom-4 text-yellow-500/10"><Trophy size={80} /></div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900 p-4 rounded-xl border border-blue-500/30 flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-blue-500/20 rounded-full text-blue-500"><Zap size={24} /></div>
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">O Rápido (Volume)</p>
                <p className="text-lg font-bold text-white">{awards.topSpeed.name}</p>
                <p className="text-xs text-zinc-400">{awards.topSpeed.count} vendas realizadas</p>
              </div>
              <div className="absolute -right-4 -bottom-4 text-blue-500/10"><Zap size={80} /></div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-zinc-900 p-4 rounded-xl border border-purple-500/30 flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-purple-500/20 rounded-full text-purple-500"><Diamond size={24} /></div>
              <div>
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Ticket de Ouro (Média)</p>
                <p className="text-lg font-bold text-white">{awards.topTicket.name}</p>
                <p className="text-xs text-zinc-400">{money(awards.topTicket.ticket)} por cliente</p>
              </div>
              <div className="absolute -right-4 -bottom-4 text-purple-500/10"><Diamond size={80} /></div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-6">Performance Individual (Todos)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volunteerStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(val) => `R$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', color: '#fff' }}
                  formatter={(value: number) => [money(value), 'Vendas']}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {volunteerStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#eab308' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Evolução + Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide mb-6">
            <TrendingUp size={20} className="text-green-500" /> Evolução Diária
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(val) => `D${val}`} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(val) => `R$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fff' }} formatter={(value: number) => [money(value), 'Receita']} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Mix de Categorias</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {salesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', color: '#fff' }} formatter={(value: number) => [money(value), 'Categoria']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
