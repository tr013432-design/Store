import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Product } from '../types';
import { analyzeSales } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Sparkles, TrendingUp, DollarSign, Package, Calendar, ChevronLeft, ChevronRight, BarChart3, Wallet } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, products }) => {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Estado para controle do Mês/Ano selecionado
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Funções de navegação de data
  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };
  
  const formattedMonth = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // --- FILTRAGEM DE DADOS (Core da análise mensal) ---
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedDate.getMonth() && 
             tDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  // --- KPIS (Indicadores Chave de Performance) ---
  const totalRevenue = monthTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalSales = monthTransactions.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // --- PREPARAÇÃO PARA GRÁFICOS ---
  
  // 1. Evolução Diária (Gráfico de Área/Linha)
  const dailyData = useMemo(() => {
    // Cria array com todos os dias do mês
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      revenue: 0,
      count: 0
    }));

    monthTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      if (data[day - 1]) {
        data[day - 1].revenue += t.total;
        data[day - 1].count += 1;
      }
    });
    return data;
  }, [monthTransactions, selectedDate]);

  // 2. Vendas por Categoria
  const salesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    monthTransactions.flatMap(t => t.items).forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + (item.price * item.quantity);
    });
    return Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Ordenar do maior para o menor
  }, [monthTransactions]);

  // 3. Métodos de Pagamento
  const paymentMethods = useMemo(() => {
    const methods: Record<string, number> = {};
    monthTransactions.forEach(t => {
        methods[t.paymentMethod] = (methods[t.paymentMethod] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  // --- IA INSIGHT ---
  useEffect(() => {
    const fetchInsight = async () => {
      if (monthTransactions.length > 5) { // Só analisa se tiver dados relevantes
        setLoading(true);
        const data = await analyzeSales(monthTransactions, products);
        setInsight(data);
        setLoading(false);
      } else {
        setInsight(null);
      }
    };
    fetchInsight();
  }, [monthTransactions.length, selectedDate]); // Reanalisa quando muda o mês ou entram vendas

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER: Título e Seletor de Data */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Performance Mensal</h2>
            <p className="text-slate-500 text-sm mt-1">Visão estratégica e resultados financeiros</p>
        </div>
        
        {/* Seletor de Mês Estilizado */}
        <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 text-slate-500 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
            <div className="flex items-center gap-2 px-4 min-w-[180px] justify-center font-semibold text-slate-700">
                <Calendar size={18} className="text-indigo-600 mb-0.5" />
                <span className="capitalize">{formattedMonth}</span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 text-slate-500 rounded-lg transition-colors"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* KPI CARDS (Design Executivo) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard 
            icon={DollarSign} 
            label="Receita Mensal" 
            value={`R$ ${totalRevenue.toFixed(2)}`} 
            color="indigo"
            subtext="Faturamento bruto no período"
        />
        <KpiCard 
            icon={BarChart3} 
            label="Vendas Realizadas" 
            value={totalSales.toString()} 
            color="emerald"
            subtext="Transações concluídas"
        />
        <KpiCard 
            icon={Wallet} 
            label="Ticket Médio" 
            value={`R$ ${averageTicket.toFixed(2)}`} 
            color="blue"
            subtext="Média de gasto por cliente"
        />
        
        {/* Card IA Compacto */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={80} />
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
                    <Sparkles size={16} className="text-yellow-400" />
                </div>
                <p className="font-semibold text-xs tracking-wider uppercase text-slate-300">Inteligência RGP</p>
            </div>
            
            <div className="relative z-10">
                {loading ? (
                    <div className="flex gap-2 items-center text-sm text-slate-400"><span className="animate-pulse">Analisando dados...</span></div>
                ) : insight ? (
                    <p className="text-sm font-medium leading-relaxed text-slate-100 line-clamp-3">"{insight.insight}"</p>
                ) : (
                    <p className="text-xs text-slate-500 italic">Insira mais dados neste mês para gerar insights.</p>
                )}
            </div>
        </div>
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Evolução Financeira (Ocupa 2 colunas) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600"/> Evolução Diária da Receita
             </h3>
             <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">{formattedMonth}</span>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickFormatter={(val) => `Dia ${val}`}
                    minTickGap={30}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickFormatter={(val) => `R$${val}`} 
                />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelFormatter={(label) => `Dia ${label}`}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                />
                <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Mix de Produtos (Categorias) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Mix de Vendas</h3>
          <p className="text-xs text-slate-400 mb-6">Distribuição por categoria</p>
          
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legenda Customizada */}
          <div className="flex flex-col gap-2 mt-4 max-h-[100px] overflow-y-auto custom-scrollbar">
             {salesByCategory.map((entry, index) => (
                 <div key={entry.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                        <span className="text-slate-600">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">R$ {entry.value.toFixed(0)}</span>
                 </div>
             ))}
             {salesByCategory.length === 0 && <p className="text-center text-xs text-slate-400">Sem dados.</p>}
          </div>
        </div>
      </div>
        
      {/* 3. Métodos de Pagamento (Barra Horizontal Clean) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-800 mb-6">Preferência de Pagamento</h3>
         <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethods} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} width={100}/>
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}}/>
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} activeBar={{fill: '#2563eb'}}>
                    {paymentMethods.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.name === 'Pix' ? '#10b981' : entry.name === 'Dinheiro' ? '#14b8a6' : '#6366f1'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
      
      {/* Estilos Globais para Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};

// Componente Auxiliar de Card KPI
const KpiCard = ({ icon: Icon, label, value, color, subtext }: any) => {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-slate-100 text-slate-600'}`}>
                    <Icon size={24} />
                </div>
            </div>
            <p className="text-xs text-slate-400 font-medium border-t border-slate-50 pt-3 mt-auto">
                {subtext}
            </p>
        </div>
    );
};
