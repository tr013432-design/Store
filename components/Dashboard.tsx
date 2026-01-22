import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Product } from '../types';
import { analyzeSales } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Sparkles, TrendingUp, DollarSign, Package, Calendar, ChevronLeft, ChevronRight, 
  BarChart3, Wallet, Target, Edit3, Check, X 
} from 'lucide-react'; // Adicionei Target, Edit3, Check e X

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, products }) => {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- NOVA LÓGICA DE META ---
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [goals, setGoals] = useState<Record<string, number>>({});

  // Chave única para o mês atual (ex: "2026-0-meta" para Janeiro)
  const monthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-meta`;
  const currentGoal = goals[monthKey] || 0; // Se não tiver meta, assume 0

  // Carregar metas salvas ao iniciar
  useEffect(() => {
    const savedGoals = localStorage.getItem('sara_store_goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Salvar nova meta
  const handleSaveGoal = () => {
    const value = parseFloat(tempGoal.replace(',', '.')); // Aceita vírgula ou ponto
    if (!isNaN(value)) {
      const newGoals = { ...goals, [monthKey]: value };
      setGoals(newGoals);
      localStorage.setItem('sara_store_goals', JSON.stringify(newGoals));
    }
    setIsEditingGoal(false);
  };

  const startEditing = () => {
    setTempGoal(currentGoal.toString());
    setIsEditingGoal(true);
  };
  // ---------------------------

  const prevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  
  // Formatação para maiúsculo (JANEIRO DE 2026)
  const formattedMonth = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  const totalRevenue = monthTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalSales = monthTransactions.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // Cálculo da porcentagem da meta
  const goalProgress = currentGoal > 0 ? Math.min((totalRevenue / currentGoal) * 100, 100) : 0;

  const dailyData = useMemo(() => {
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, revenue: 0, count: 0 }));
    monthTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      if (data[day - 1]) { data[day - 1].revenue += t.total; data[day - 1].count += 1; }
    });
    return data;
  }, [monthTransactions, selectedDate]);

  const salesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    monthTransactions.flatMap(t => t.items).forEach(item => { categories[item.category] = (categories[item.category] || 0) + (item.price * item.quantity); });
    return Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
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
      
      {/* CABEÇALHO COM NAVEGAÇÃO DE MÊS */}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* CARD DE RECEITA COM META INTEGRADA */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Receita Mensal</p>
                    <h3 className="text-2xl font-black text-white mt-1">R$ {totalRevenue.toFixed(2)}</h3>
                </div>
                <div className="p-3 rounded-xl text-green-500 bg-green-500/10"><DollarSign size={24} /></div>
            </div>

            {/* ÁREA DA META */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                        <Target size={12} /> Meta
                    </span>
                    
                    {/* Botão de Editar ou Inputs */}
                    {isEditingGoal ? (
                        <div className="flex items-center gap-1">
                            <input 
                                autoFocus
                                type="number" 
                                value={tempGoal}
                                onChange={(e) => setTempGoal(e.target.value)}
                                className="w-20 bg-zinc-950 border border-zinc-700 rounded px-1 text-xs text-white focus:outline-none focus:border-green-500"
                            />
                            <button onClick={handleSaveGoal} className="p-1 bg-green-600 rounded hover:bg-green-500 text-white"><Check size={12}/></button>
                            <button onClick={() => setIsEditingGoal(false)} className="p-1 bg-zinc-700 rounded hover:bg-zinc-600 text-white"><X size={12}/></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditing}>
                            <span className="text-xs font-semibold text-zinc-300">
                                {currentGoal > 0 ? `R$ ${currentGoal.toLocaleString('pt-BR')}` : 'Definir Meta'}
                            </span>
                            <Edit3 size={12} className="text-zinc-600 group-hover:text-green-500 transition-colors" />
                        </div>
                    )}
                </div>

                {/* Barra de Progresso */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500" 
                        style={{ width: `${goalProgress}%` }}
                    />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 text-right">{goalProgress.toFixed(0)}% atingido</p>
            </div>
        </div>

        <KpiCard icon={BarChart3} label="Vendas" value={totalSales.toString()} color="blue" subtext="Transações concluídas" />
        <KpiCard icon={Wallet} label="Ticket Médio" value={`R$ ${averageTicket.toFixed(2)}`} color="purple" subtext="Média por cliente" />
        
        {/* CARD IA */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-2xl border border-zinc-700/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={80} /></div>
            <div className="flex items-center gap-2 mb-3">
                <div className="bg-white/5 p-1.5 rounded-lg backdrop-blur-sm"><Sparkles size={16} className="text-green-400" /></div>
                <p className="font-bold text-[10px] tracking-widest uppercase text-green-500">IA RGP</p>
            </div>
            <div className="relative z-10">
                {loading ? <div className="flex gap-2 items-center text-sm text-zinc-400"><span className="animate-pulse">Analisando...</span></div> : insight ? <p className="text-sm font-medium leading-relaxed text-zinc-300">"{insight.insight}"</p> : <p className="text-xs text-zinc-500 italic">Insira mais dados para gerar insights.</p>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide"><TrendingUp size={20} className="text-green-500"/> Evolução Diária</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `D${val}`} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `R$${val}`} />
                <Tooltip contentStyle={{backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fff'}} labelFormatter={(label) => `Dia ${label}`} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Mix de Vendas</h3>
          <p className="text-xs text-zinc-500 mb-6 uppercase tracking-widest">Por Categoria</p>
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
          <div className="flex flex-col gap-2 mt-4 max-h-[100px] overflow-y-auto custom-scrollbar">
             {salesByCategory.map((entry, index) => (
                 <div key={entry.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} /><span className="text-zinc-400">{entry.name}</span></div>
                    <span className="font-bold text-zinc-200">R$ {entry.value.toFixed(0)}</span>
                 </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, color, subtext }: any) => {
    const colors: Record<string, string> = {
        green: 'text-green-500 bg-green-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
    };
    return (
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-green-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p><h3 className="text-2xl font-black text-white mt-1">{value}</h3></div>
                <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={24} /></div>
            </div>
            <p className="text-[10px] text-zinc-600 font-medium border-t border-zinc-800 pt-3 mt-auto uppercase tracking-wide">{subtext}</p>
        </div>
    );
};
