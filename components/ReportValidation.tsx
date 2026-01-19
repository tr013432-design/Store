import React, { useState } from 'react';
import { DailyReport, OrderSheet } from '../types';
import { CheckCircle, Clock, FileText, ChevronDown, ChevronUp, AlertCircle, ShoppingBag, Phone, User, Users } from 'lucide-react';

interface ReportValidationProps {
  reports: DailyReport[];
  orders: OrderSheet[]; // Recebe também as encomendas
  onValidateReport: (id: string) => void;
  onValidateOrder: (id: string) => void;
}

export const ReportValidation: React.FC<ReportValidationProps> = ({ reports, orders, onValidateReport, onValidateOrder }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtros
  const pendingReports = reports.filter(r => r.status === 'PENDENTE');
  const pendingOrders = orders.filter(o => o.status === 'PENDENTE');
  
  const validatedReports = reports.filter(r => r.status === 'VALIDADO');
  const validatedOrders = orders.filter(o => o.status === 'ENTREGUE'); // ou Validado

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-indigo-600" /> Validação Pastoral
        </h2>
      </div>

      {/* --- SEÇÃO 1: VENDAS (DINHEIRO) --- */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            Financeiro e Vendas do Dia ({pendingReports.length})
        </h3>
        
        {pendingReports.length === 0 && pendingOrders.length === 0 ? (
            <p className="text-slate-400 text-sm italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">Tudo validado! Nenhuma pendência.</p>
        ) : null}

        <div className="space-y-4">
            {pendingReports.map(report => (
                <ReportCard key={report.id} report={report} isExpanded={expandedId === report.id} onToggle={() => toggleExpand(report.id)} onAction={() => onValidateReport(report.id)} />
            ))}
        </div>
      </div>

      {/* --- SEÇÃO 2: ENCOMENDAS (PEDIDOS) --- */}
      {pendingOrders.length > 0 && (
        <div className="mt-8">
            <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2">
                <ShoppingBag size={16} /> Encomendas para Aprovar ({pendingOrders.length})
            </h3>
            <div className="space-y-4">
                {pendingOrders.map(order => (
                    <OrderCard key={order.id} order={order} isExpanded={expandedId === order.id} onToggle={() => toggleExpand(order.id)} onAction={() => onValidateOrder(order.id)} />
                ))}
            </div>
        </div>
      )}

      {/* --- HISTÓRICO --- */}
      {(validatedReports.length > 0 || validatedOrders.length > 0) && (
        <div className="opacity-60 mt-12">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle size={16} /> Histórico Recente
            </h3>
            <div className="space-y-2">
                {validatedReports.slice(0, 3).map(r => (
                    <div key={r.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center text-xs">
                        <span>Relatório de Vendas: {r.serviceType} ({r.volunteerName})</span>
                        <span className="font-bold text-emerald-600">Validado</span>
                    </div>
                ))}
                {validatedOrders.slice(0, 3).map(o => (
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

// --- CARD DE RELATÓRIO DE VENDAS (Igual ao anterior) ---
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
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                     {/* Resumo da Tabela */}
                     <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 font-semibold text-slate-500">
                                <tr><th className="p-2">Qtd</th><th className="p-2">Item</th><th className="p-2 text-right">Valor</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {report.items.map((i: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="p-2">{i.quantity}</td>
                                        <td className="p-2">{i.productName}</td>
                                        <td className="p-2 text-right">R$ {i.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {report.notes && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800 mb-4 font-medium">
                            Nota: {report.notes}
                        </div>
                    )}
                    <button onClick={onAction} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700">Confirmar Recebimento do Dinheiro</button>
                </div>
            )}
        </div>
    );
}

// --- CARD DE ENCOMENDAS (Novo Design) ---
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
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                        {order.items.length} Pedidos
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 bg-indigo-50/30 p-4">
                     <div className="space-y-3 mb-4">
                        {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex flex-col sm:flex-row justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                        <User size={14} className="text-indigo-400"/> {item.customerName}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Users size={12}/> {item.customerTeam || 'Sem equipe'}</span>
                                        <span className="flex items-center gap-1"><Phone size={12}/> {item.customerPhone}</span>
                                    </div>
                                </div>
                                <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                    <p className="text-sm font-medium text-indigo-900">{item.quantity}x {item.productName}</p>
                                    <p className="text-xs text-slate-400">Total: R$ {item.total.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                    <button onClick={onAction} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2">
                        <CheckCircle size={18}/> Validar Lista de Encomendas
                    </button>
                </div>
            )}
        </div>
    );
}
