import React, { useState, useMemo } from 'react';
import { DailyReport, OrderSheet } from '../types';
import { CheckCircle, ShoppingBag, Phone, User, Users, FileText, Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface ReportValidationProps {
  reports: DailyReport[];
  orders: OrderSheet[];
  onValidateReport: (id: string) => void;
  onValidateOrder: (id: string) => void;
  onUnvalidateReport: (id: string) => void;
  onUnvalidateOrder: (id: string) => void;
}

export const ReportValidation: React.FC<ReportValidationProps> = ({ 
  reports, orders, onValidateReport, onValidateOrder, onUnvalidateReport, onUnvalidateOrder 
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // ESTADOS DOS FILTROS
  const [volunteerFilter, setVolunteerFilter] = useState('Todos');
  const [serviceFilter, setServiceFilter] = useState('Todos');

  // 1. Extrair opções para filtros
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

  // 3. Listas Filtradas
  const pendingReports = filterList(reports.filter(r => r.status === 'PENDENTE'));
  const pendingOrders = filterList(orders.filter(o => o.status === 'PENDENTE'));
  
  const validatedReports = filterList(reports.filter(r => r.status === 'VALIDADO'));
  const validatedOrders = filterList(orders.filter(o => o.status === 'ENTREGUE'));

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const clearFilters = () => {
    setVolunteerFilter('Todos');
    setServiceFilter('Todos');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-indigo-600" /> Validação Pastoral
        </h2>
        
        {/* BARRA DE FILTROS */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-2 text-slate-400">
                <Filter size={16} />
                <span className="text-xs font-bold uppercase">Filtrar:</span>
            </div>
            <select 
                value={volunteerFilter} 
                onChange={e => setVolunteerFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
            >
                {uniqueVolunteers.map(v => <option key={v} value={v}>{v === 'Todos' ? 'Todos Voluntários' : v}</option>)}
            </select>
            <select 
                value={serviceFilter} 
                onChange={e => setServiceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
            >
                {uniqueServices.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos os Cultos' : s}</option>)}
            </select>
            {(volunteerFilter !== 'Todos' || serviceFilter !== 'Todos') && (
                <button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button>
            )}
        </div>
      </div>

      {/* --- PENDENTES (Vendas) --- */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            Vendas Pendentes ({pendingReports.length})
        </h3>
        {pendingReports.length === 0 ? <p className="text-sm text-slate-400 italic">Nenhum relatório pendente.</p> : 
            pendingReports.map(report => (
                <ReportCard key={report.id} report={report} isExpanded={expandedId === report.id} onToggle={() => toggleExpand(report.id)} onAction={() => onValidateReport(report.id)} />
            ))
        }
      </div>

      {/* --- PENDENTES (Encomendas) --- */}
      {pendingOrders.length > 0 && (
        <div className="mt-6">
            <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">
                Encomendas Pendentes ({pendingOrders.length})
            </h3>
            {pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} isExpanded={expandedId === order.id} onToggle={() => toggleExpand(order.id)} onAction={() => onValidateOrder(order.id)} />
            ))}
        </div>
      )}

      {/* --- HISTÓRICO VALIDADO --- */}
      {(validatedReports.length > 0 || validatedOrders.length > 0) && (
        <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-6 flex items-center gap-2">
                <CheckCircle size={16} /> Histórico Validado
            </h3>
            
            <div className="space-y-4">
                {validatedReports.map(report => (
                    <ReportCard 
                        key={report.id} 
                        report={report} 
                        isExpanded={expandedId === report.id} 
                        onToggle={() => toggleExpand(report.id)} 
                        onAction={() => {}} 
                        onUndo={() => onUnvalidateReport(report.id)}
                    />
                ))}

                {validatedOrders.map(order => (
                    <OrderCard 
                        key={order.id} 
                        order={order} 
                        isExpanded={expandedId === order.id} 
                        onToggle={() => toggleExpand(order.id)} 
                        onAction={() => {}} 
                        onUndo={() => onUnvalidateOrder(order.id)}
                    />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTES DE CARD ---

const ReportCard = ({ report, isExpanded, onToggle, onAction, onUndo }: any) => {
    const isVal = report.status === 'VALIDADO';

    return (
        <div className={`mb-3 bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? (isVal ? 'shadow-md border-emerald-200' : 'shadow-lg border-amber-400 ring-1 ring-amber-400') : 'shadow-sm border-slate-200'}`}>
            <div onClick={onToggle} className={`p-5 flex justify-between items-center cursor-pointer ${isVal ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                <div className="flex gap-4 items-center">
                    <div className={`p-2 rounded-lg ${isVal ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {isVal ? <CheckCircle size={24}/> : <FileText size={24} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{report.serviceType}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Resp: {report.volunteerName}</span>
                            {isVal && <span className="bg-emerald-100 text-emerald-700 px-2 rounded-full font-bold">Validado</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Total Caixa</p>
                        <p className={`text-lg font-bold ${isVal ? 'text-emerald-700' : 'text-slate-800'}`}>R$ {report.grandTotal.toFixed(2)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-300"/> : <ChevronDown size={20} className="text-slate-300"/>}
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 bg-white p-4 animate-fade-in">
                     <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-4">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 font-semibold text-slate-500">
                                <tr><th className="p-2">Qtd</th><th className="p-2">Item</th><th className="p-2 text-right">Valor</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
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
                    
                    {/* Botões de Ação */}
                    {!isVal ? (
                        <button onClick={onAction} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md">
                            Confirmar Recebimento do Dinheiro
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <div className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl font-bold text-center text-xs flex justify-center items-center gap-2 border border-emerald-100">
                                <CheckCircle size={14}/> Relatório Finalizado
                            </div>
                            <button 
                                onClick={() => { if(window.confirm('Tem certeza? Isso vai remover a receita do painel e DEVOLVER os itens ao estoque.')) onUndo() }} 
                                className="px-4 py-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl border border-slate-200 transition-colors flex items-center gap-2 text-xs font-bold"
                            >
                                <RotateCcw size={14}/> Desvalidar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const OrderCard = ({ order, isExpanded, onToggle, onAction, onUndo }: any) => {
    const isVal = order.status === 'ENTREGUE';

    return (
        <div className={`mb-3 bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? (isVal ? 'shadow-md border-emerald-200' : 'shadow-lg border-indigo-500 ring-1 ring-indigo-500') : 'shadow-sm border-slate-200'}`}>
            <div onClick={onToggle} className={`p-5 flex justify-between items-center cursor-pointer ${isVal ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                <div className="flex gap-4 items-center">
                    <div className={`p-2 rounded-lg ${isVal ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {isVal ? <CheckCircle size={24}/> : <ShoppingBag size={24}/>}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{order.serviceType}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                             <span>Resp: {order.volunteerName}</span>
                             {isVal && <span className="bg-emerald-100 text-emerald-700 px-2 rounded-full font-bold">Aprovado</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Total</p>
                        <p className={`text-lg font-bold ${isVal ? 'text-emerald-700' : 'text-indigo-700'}`}>R$ {order.grandTotal.toFixed(2)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-300"/> : <ChevronDown size={20} className="text-slate-300"/>}
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 bg-white p-4 animate-fade-in">
                     <div className="space-y-2 mb-4">
                        {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row justify-between gap-2 text-xs">
                                <div>
                                    <div className="font-bold text-slate-700 flex items-center gap-2">
                                        <User size={12}/> {item.customerName}
                                    </div>
                                    <div className="text-slate-500 mt-1 flex gap-2">
                                        <span className="flex items-center gap-1"><Phone size={10}/> {item.customerPhone}</span>
                                        <span className="bg-white px-1.5 rounded border border-slate-200 text-slate-600">{item.paymentMethod}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-slate-800">{item.quantity}x {item.productName}</p>
                                    <p className="text-slate-400">R$ {item.total.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                     
                    {!isVal ? (
                        <button onClick={onAction} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-md">
                            <CheckCircle size={18}/> Validar Recebimento das Encomendas
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <div className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl font-bold text-center text-xs flex justify-center items-center gap-2 border border-emerald-100">
                                <CheckCircle size={14}/> Encomendas Finalizadas
                            </div>
                            <button 
                                onClick={() => { if(window.confirm('Reabrir lista de encomendas? Isso removerá a receita do caixa.')) onUndo() }} 
                                className="px-4 py-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl border border-slate-200 transition-colors flex items-center gap-2 text-xs font-bold"
                            >
                                <RotateCcw size={14}/> Desvalidar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
