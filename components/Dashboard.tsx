import React, { useEffect, useState } from 'react';
import { Transaction, Product } from '../types';
import { analyzeSales } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Sparkles, TrendingUp, AlertTriangle, DollarSign, Package } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, products }) => {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // KPIs
  const totalRevenue = transactions.reduce((acc, t) => acc + t.total, 0);
  const totalSales = transactions.length;
  
  // Data for charts
  const salesByCategory = transactions.flatMap(t => t.items).reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));

  const paymentMethods = transactions.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      const data = await analyzeSales(transactions, products);
      setInsight(data);
      setLoading(false);
    };
    if (transactions.length > 0 && !insight) {
      fetchInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]); // Only re-analyze if transaction count changes significantly

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Painel Geral</h2>
        <div className="text-sm text-slate-500">Última atualização: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Receita Total</p>
            <p className="text-2xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Vendas Realizadas</p>
            <p className="text-2xl font-bold text-slate-800">{totalSales}</p>
          </div>
        </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Produtos Ativos</p>
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-md text-white">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-yellow-300" />
                <p className="font-semibold text-sm opacity-90">IA Insight</p>
            </div>
            {loading ? (
                <p className="text-xs opacity-75 animate-pulse">Analisando dados...</p>
            ) : insight ? (
                <p className="text-sm font-medium leading-tight">{insight.insight || "Tudo parece normal."}</p>
            ) : (
                <p className="text-xs opacity-75">Aguardando dados...</p>
            )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Vendas por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Métodos de Pagamento</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                    <span className="text-sm text-slate-600">{entry.name}</span>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {insight && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex gap-3 items-start">
                <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
                <div>
                    <h3 className="font-semibold text-amber-900 mb-1">Recomendações Inteligentes</h3>
                    <p className="text-amber-800 text-sm mb-2">{insight.suggestion}</p>
                    {insight.lowStockAlerts && insight.lowStockAlerts.length > 0 && (
                        <div className="mt-2">
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Alerta de Estoque:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {insight.lowStockAlerts.map((item: string) => (
                                    <span key={item} className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs text-amber-900 font-medium">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};