import React, { useState, useMemo } from 'react';
import { DailyReport, OrderSheet } from '../types';
import { CheckCircle, ShoppingBag, Phone, User, Users, FileText, Filter, X } from 'lucide-react';

interface ReportValidationProps {
  reports: DailyReport[];
  orders: OrderSheet[];
  onValidateReport: (id: string) => void;
  onValidateOrder: (id: string) => void;
}

export const ReportValidation: React.FC<ReportValidationProps> = ({ reports, orders, onValidateReport, onValidateOrder }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // ESTADOS DOS FILTROS
  const [volunteerFilter, setVolunteerFilter] = useState('Todos');
  const [serviceFilter, setServiceFilter] = useState('Todos');

  // 1. Extrair opções únicas para os Dropdowns (baseado no que tem na lista)
  const uniqueVolunteers = useMemo(() => {
    const allItems = [...reports, ...orders];
    const names = allItems.map(i => i.volunteerName).filter(Boolean);
    return ['Todos', ...Array.from(new Set(names))];
  }, [reports, orders]);

  const uniqueServices = useMemo(() => {
    const allItems = [...reports, ...orders];
    const services = allItems.map(i => i.serviceType).filter(Boolean);
    return ['Todos', ...Array.from(new Set(services))];
  }, [reports, orders]);

  // 2. Função de Filtragem
  const filterList = (list: any[]) => {
    return list.filter(item => {
        const matchVol = volunteerFilter === 'Todos' || item.volunteerName === volunteerFilter;
        const matchServ = serviceFilter === 'Todos' || item.serviceType === serviceFilter;
        return matchVol && matchServ;
    });
  };

  // 3. Aplicar Filtros nas Listas
  const pendingReports = filterList(reports.filter(r => r.status === 'PENDENTE'));
  const pendingOrders = filterList(orders.filter(o => o.status === 'PENDENTE'));
  
  const validatedReports = filterList(reports.filter(r => r.status === 'VALIDADO'));
  const validatedOrders = filterList(orders.filter(o => o.status === 'ENTREGUE'));

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  // Função para limpar filtros
  const clearFilters = () => {
    setVolunteerFilter('Todos');
    setServiceFilter('Todos');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-indigo-600" /> Validação Pastoral
        </h2>
        
        {/* BARRA DE FILTROS */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-2 text-slate-400">
                <Filter size={16} />
                <span className="text-xs font-bold uppercase">Filtrar por:</span>
            </div>
            
            {/* Filtro Voluntário */}
            <select 
                value={volunteerFilter} 
                onChange={e => setVolunteerFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
                {uniqueVolunteers.map(v => <option key={v} value={v}>{v === 'Todos' ? 'Todos Voluntários' : v}</option>)}
            </select>

            {/* Filtro Culto */}
            <select 
                value={serviceFilter} 
                onChange={e => setServiceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
                {uniqueServices.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos os Cultos' : s}</option>)}
            </select>

            {(volunteerFilter !== 'Todos' || serviceFilter !== 'Todos') && (
                <button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Limpar Filtros">
                    <X size={18} />
                </button>
            )}
        </div>
      </div>

      {/* --- SEÇÃO 1: VENDAS (DINHEIRO) --- */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex justify-between">
            <span>Vendas do Dia</span>
            <span className="bg-slate-100 text-slate-600 px-2 rounded-full text-xs flex items-center">{pendingReports.length}</span>
        </h3>
        
        {pendingReports.length === 0 ? (
             <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                <p className="text-sm">Nenhum relatório de venda pendente {volunteerFilter !== 'Todos' ? 'para este filtro' : ''}.</p>
             </div>
        ) : (
            <div className="space-y-4">
                {pendingReports.map(report => (
                    <ReportCard key={report.id} report={report} isExpanded={expandedId === report.id} onToggle={() => toggleExpand(report.id)} onAction={() => onValidateReport(report.id)} />
                ))}
            </div>
        )}
      </div>

      {/* --- SEÇÃO 2: ENCOMENDAS --- */}
      <div>
        <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2 flex items-center justify-between gap-2 mt-8">
            <span className="flex items-center gap-2"><ShoppingBag size={16} /> Encomendas Pagas</span>
            <span className="bg-indigo-50 text-indigo-600 px-2 rounded-full text-xs flex items-center">{pendingOrders.length}</span>
        </h3>

        {pendingOrders.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                <p className="text-sm">Nenhuma encomenda pendente {serviceFilter !== 'Todos' ? 'para este culto' : ''}.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {pendingOrders.map(order => (
                    <OrderCard key={order.id} order={order} isExpanded={expandedId === order.id} onToggle={() => toggleExpand(order.id)} onAction={() => onValidateOrder(order.id)} />
                ))}
            </div>
        )}
      </div>

      {/* --- HISTÓRICO (Também Filtrado) --- */}
      {(validatedReports.length > 0 || validatedOrders.length > 0) && (
        <div className="opacity-60 mt-12">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle size={16} /> Histórico Validado (Filtrado)
            </h3>
            <div className="space-y-2">
                {validatedReports.map(r => (
                    <div key={r.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center text-xs">
                        <span>Relatório: {r.serviceType} ({r.volunteerName})</span>
                        <span className="font-bold text-emerald-600">Validado</span>
                    </div>
                ))}
                {validatedOrders.map(o => (
                    <div key={o.id} className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex justify-between items-center text-xs">
                        <span>Encomenda: {o.serviceType} ({o.volunteerName})</span>
                        <span className="font-bold text-emerald-600">Aprovado</span>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTES AUXILIARES (Cards) ---

const ReportCard = ({ report, isExpanded, onToggle, onAction }: any) => {
    return (
        <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-lg border-amber-400 ring-1 ring-amber-400' : 'shadow-sm border-slate-200'}`}>
            <div onClick={onToggle} className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                <div className="flex gap-4 items-center">
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-lg"><FileText size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-800">{report.serviceType}</h4>
                        <p className="text-xs text-slate-500">Resp: {report.volunteerName}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Total Caixa</p>
                    <p className="text-lg font-bold text-slate-800">R$ {report.grandTotal.toFixed(2)}</p>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 animate-fade-in">
                     <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 font-semibold text-slate-500">
                                <tr><th className="p-2">Qtd</th><th className="p-2">Item</th><th className="p-2 text-right">Valor</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {report.items.map((i: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="p-2">{i.quantity}</td>
                                        <td className="p-2">{i.productName} <span className="text-[10px] text-slate-400">({i.paymentMethod})</span></td>
                                        <td className="p-2 text-right">R$ {i.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Resumo Financeiro */}
                    <div className="flex gap-2 mb-4 text-[10px] uppercase font-bold text-slate-400">
                        <span className="bg-white px-2 py-1 rounded border">Pix: R$ {report.totalPix.toFixed(2)}</span>
                        <span className="bg-white px-2 py-1 rounded border">Din: R$ {report.totalCash.toFixed(2)}</span>
                        <span className="bg-white px-2 py-1 rounded border">Card: R$ {(report.totalDebit + report.totalCredit).toFixed(2)}</span>
                    </div>

                    {report.notes && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800 mb-4 font-medium">
                            Nota: {report.notes}
                        </div>
                    )}
                    <button onClick={onAction} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md">Confirmar Recebimento do Dinheiro</button>
                </div>
            )}
        </div>
    );
}

const OrderCard = ({ order, isExpanded, onToggle, onAction }: any) => {
    return (
        <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-lg border-indigo-500 ring-1 ring-indigo-500' : 'shadow-sm border-slate-200'}`}>
            <div onClick={onToggle} className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                <div className="flex gap-4 items-center">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><ShoppingBag size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-800">Encomendas: {order.serviceType}</h4>
                        <p className="text-xs text-slate-500">Resp: {order.volunteerName}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Total Encomendas</p>
                    <p className="text-lg font-bold text-indigo-700">R$ {order.grandTotal.toFixed(2)}</p>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 bg-indigo-50/30 p-4 animate-fade-in">
                     <div className="space-y-2 mb-4">
                        {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex flex-col sm:flex-row justify-between gap-2 text-xs">
                                <div>
                                    <div className="font-bold text-slate-700 flex items-center gap-2">
                                        <User size={12}/> {item.customerName}
                                    </div>
                                    <div className="text-slate-500 mt-1 flex gap-2">
                                        <span className="flex items-center gap-1"><Phone size={10}/> {item.customerPhone}</span>
                                        <span className="bg-slate-100 px-1.5 rounded text-slate-600">{item.paymentMethod}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-indigo-900">{item.quantity}x {item.productName}</p>
                                    <p className="text-slate-400">R$ {item.total.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                    <button onClick={onAction} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-md">
                        <CheckCircle size={18}/> Validar Recebimento das Encomendas
                    </button>
                </div>
            )}
        </div>
    );
}
