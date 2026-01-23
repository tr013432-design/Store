import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Product } from '../types';
import { analyzeSales } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Sparkles, TrendingUp, DollarSign, Calendar, ChevronLeft, ChevronRight, 
  BarChart3, Wallet, Target, Edit3, Check, X, Lightbulb, Users, Church,
  TrendingDown, Trophy, Zap, Diamond // <--- Novos Ícones para as Medalhas
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, products }) => {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- META (LÓGICA EXISTENTE) ---
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [goals, setGoals] = useState<Record<string, number>>({});
  const monthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-meta`;
  const currentGoal = goals[monthKey] || 0;

  useEffect(() => {
    const savedGoals = localStorage.getItem('sara_store_goals');
    if (savedGoals) { setGoals(JSON.parse(savedGoals)); }
  }, []);

  const handleSaveGoal = () => {
    const value = parseFloat(tempGoal.replace(',', '.'));
    if (!isNaN(value)) {
      const newGoals = { ...goals, [monthKey]: value };
      setGoals(newGoals);
      localStorage.setItem('sara_store_goals', JSON.stringify(newGoals));
    }
    setIsEditingGoal(false);
  };
  const startEditing = () => { setTempGoal(currentGoal.toString()); setIsEditingGoal(true); };

  // --- NAVEGAÇÃO DE DATA ---
  const prevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  const formattedMonth = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  // --- FILTRO DE MÊS ---
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  // --- KPI FINANCEIROS ---
  const financialMetrics = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    monthTransactions.forEach(t => {
      revenue += t.total;
      t.items.forEach(item => {
        const productRef = products.find(p => p.name === item.productName);
        const unitCost = productRef?.costPrice || 0;
        cost += (unitCost * item.quantity);
      });
    });
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, cost, profit, margin };
  }, [monthTransactions, products]);

  // --- LOGICA DE GAMIFICAÇÃO (MEDALHAS) ---
  const volunteerStats = useMemo(() => {
    const stats: Record<string, { revenue: number, count: number }> = {};
    
    monthTransactions.forEach(t => {
        const name = t.volunteerName || 'Não Identificado';
        // Normaliza o nome para evitar duplicatas (Ex: "Joao" e "joao")
        const cleanName = name.trim(); 
        
        if (!stats[cleanName]) stats[cleanName] = { revenue: 0, count: 0 };
        stats[cleanName].revenue += t.total;
        stats[cleanName].count += 1; // Conta quantas transações fez
    });

    // Converte para array e calcula ticket médio
    const list = Object.entries(stats).map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
        ticket: data.count > 0 ? data.revenue / data.count : 0
    }));

    // Ordena por receita para o gráfico principal
    return list.sort((a, b) => b.revenue - a.revenue);
  }, [monthTransactions]);

  // Calcula os vencedores
  const awards = useMemo(() => {
      if (volunteerStats.length === 0) return null;
      
      // 🥇 O Vendedor (Maior Receita) - Já está ordenado
      const topRevenue = volunteerStats[0];

      // ⚡ O Rápido (Mais Vendas/Quantidade)
      const topSpeed = [...volunteerStats].sort((a, b) => b.count - a.count)[0];

      // 💎 Ticket de Ouro (Maior Ticket Médio - Mínimo 2 vendas para não distorcer)
      const eligibleForTicket = volunteerStats.filter(v => v.count >= 2);
      const topTicket = eligibleForTicket.length > 0 
        ? eligibleForTicket.sort((a, b) => b.ticket - a.ticket)[0] 
        : volunteerStats[0]; // Se ninguém tiver 2 vendas, pega o top 1 mesmo

      return { topRevenue, topSpeed, topTicket };
  }, [volunteerStats]);


  // Outros Gráficos
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, revenue: 0 }));
    monthTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      if (data[day - 1]) { data[day - 1].revenue += t.total; }
    });
    return data;
  }, [monthTransactions, selectedDate]);

  const salesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    monthTransactions.flatMap(t => t.items).forEach(item => { categories[item.category] = (categories[item.category] || 0) + (item.price * item.quantity); });
    return Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const salesByService = useMemo(() => {
    const servMap: Record<string, number> = {};
    monthTransactions.forEach(t => { const service = t.serviceType || 'Outros'; servMap[service] = (servMap[service] || 0) + t.total; });
    return Object.entries(servMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (monthTransactions.length > 5) {
        setLoading(true);
        const data = await analyzeSales(monthTransactions, products);
        setInsight(data);
        setLoading(false);
      } else { setInsight(null); }
    };
    fetchInsight();
  }, [monthTransactions.length, selectedDate]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Performance</h2>
            <p className="text-green-500 text-sm mt-1 font-bold tracking-widest uppercase">Visão Mensal</p>
        </div>
        <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"><ChevronLeft size={20}/></button>
            <div className="flex items-center gap-2 px-4 min-w-[200px] justify-center font-bold text-zinc-200 uppercase tracking-wider text-sm">
                <Calendar size={16} className="text-green-500 mb-0.5" />
                <span>{formattedMonth}</span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* KPI FINANCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card Receita */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start mb-2">
                <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Receita Bruta</p><h3 className="text-2xl font-black text-white mt-1">R$ {financialMetrics.revenue.toFixed(2)}</h3></div>
                <div className="p-3 rounded-xl text-blue-500 bg-blue-500/10"><DollarSign size={24} /></div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1"><Target size={12} /> Meta</span>
                    {isEditingGoal ? (
                        <div className="flex items-center gap-1">
                            <input autoFocus type="number" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)} className="w-20 bg-zinc-950 border border-zinc-700 rounded px-1 text-xs text-white focus:outline-none focus:border-green-500" />
                            <button onClick={handleSaveGoal} className="p-1 bg-green-600 rounded hover:bg-green-500 text-white"><Check size={12}/></button>
                            <button onClick={() => setIsEditingGoal(false)} className="p-1 bg-zinc-700 rounded hover:bg-zinc-600 text-white"><X size={12}/></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditing}>
                            <span className="text-xs font-semibold text-zinc-300">{currentGoal > 0 ? `R$ ${currentGoal.toLocaleString('pt-BR')}` : 'Definir'}</span>
                            <Edit3 size={12} className="text-zinc-600 group-hover:text-green-500 transition-colors" />
                        </div>
                    )}
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500" style={{ width: `${(currentGoal > 0 ? Math.min((financialMetrics.revenue / currentGoal) * 100, 100) : 0)}%` }} />
                </div>
            </div>
        </div>

        {/* Lucro Real */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Lucro Líquido</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">R$ {financialMetrics.profit.toFixed(2)}</h3>
                </div>
                <div className="p-3 rounded-xl text-emerald-500 bg-emerald-500/10"><TrendingUp size={24} /></div>
            </div>
            <div className="border-t border-zinc-800 pt-3 mt-auto flex justify-between items-center">
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Margem Real</p>
               <span className={`text-xs font-bold ${financialMetrics.margin > 20 ? 'text-emerald-400' : 'text-yellow-500'}`}>{financialMetrics.margin.toFixed(1)}%</span>
            </div>
        </div>
        
        {/* IA Card */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-2xl border border-zinc-700/50 flex flex-col justify-between relative overflow-hidden group md:col-span-2">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={80} /></div>
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-white/5 p-1.5 rounded-lg backdrop-blur-sm"><Sparkles size={16} className="text-green-400" /></div>
                <p className="font-bold text-[10px] tracking-widest uppercase text-green-500">IA RGP • Estratégia</p>
            </div>
            <div className="relative z-10 space-y-4">
                {loading ? (
                    <div className="flex gap-2 items-center text-sm text-zinc-400"><span className="animate-pulse">Analisando Margens...</span></div>
                ) : insight ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Diagnóstico</p><p className="text-sm font-medium leading-relaxed text-zinc-300">"{insight.insight}"</p></div>
                        <div className="border-l border-zinc-700 pl-4">
                            <div className="flex items-center gap-1.5 mb-1"><Lightbulb size={12} className="text-yellow-500" /><p className="text-[10px] uppercase tracking-wider text-yellow-500 font-bold">Ação Recomendada</p></div>
                            <p className="text-sm font-medium leading-relaxed text-zinc-100">{insight.suggestion || "Continue vendendo para gerar novas estratégias."}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 italic">Insira vendas para calcular a margem de lucro ideal.</p>
                )}
            </div>
        </div>
      </div>

      {/* --- NOVA SEÇÃO: GAMIFICAÇÃO & RANKING --- */}
      <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <Trophy className="text-yellow-500" size={24} />
             <h3 className="text-xl font-bold text-white uppercase tracking-wide">Ranking & Premiações</h3>
          </div>

          {/* PODIUM (Cards de Medalhas) */}
          {awards && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 🥇 O Vendedor */}
                <div className="bg-gradient-to-br from-yellow-900/20 to-zinc-900 p-4 rounded-xl border border-yellow-500/30 flex items-center gap-4 relative overflow-hidden">
                    <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500"><Trophy size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">O Vendedor (Receita)</p>
                        <p className="text-lg font-bold text-white">{awards.topRevenue.name}</p>
                        <p className="text-xs text-zinc-400">R$ {awards.topRevenue.revenue.toFixed(2)} vendidos</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-yellow-500/10"><Trophy size={80} /></div>
                </div>

                {/* ⚡ O Rápido */}
                <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900 p-4 rounded-xl border border-blue-500/30 flex items-center gap-4 relative overflow-hidden">
                    <div className="p-3 bg-blue-500/20 rounded-full text-blue-500"><Zap size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">O Rápido (Volume)</p>
                        <p className="text-lg font-bold text-white">{awards.topSpeed.name}</p>
                        <p className="text-xs text-zinc-400">{awards.topSpeed.count} vendas realizadas</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-blue-500/10"><Zap size={80} /></div>
                </div>

                {/* 💎 Ticket de Ouro */}
                <div className="bg-gradient-to-br from-purple-900/20 to-zinc-900 p-4 rounded-xl border border-purple-500/30 flex items-center gap-4 relative overflow-hidden">
                    <div className="p-3 bg-purple-500/20 rounded-full text-purple-500"><Diamond size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Ticket de Ouro (Média)</p>
                        <p className="text-lg font-bold text-white">{awards.topTicket.name}</p>
                        <p className="text-xs text-zinc-400">R$ {awards.topTicket.ticket.toFixed(2)} por cliente</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-purple-500/10"><Diamond size={80} /></div>
                </div>
            </div>
          )}

          {/* GRÁFICO DE BARRAS COMPLETO (TODOS OS VOLUNTÁRIOS) */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-6">Performance Individual (Todos)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volunteerStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis dataKey="name" tick={{fill: '#71717a', fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `R$${val}`}/>
                        <Tooltip 
                            contentStyle={{backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', color: '#fff'}} 
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {volunteerStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#eab308' : '#3b82f6'} /> // Pinta o 1º lugar de dourado
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* LINHA: Evolução Diária e Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide mb-6"><TrendingUp size={20} className="text-green-500"/> Evolução Diária</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `D${val}`} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `R$${val}`} />
                <Tooltip contentStyle={{backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fff'}} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']} />
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
                    {salesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
