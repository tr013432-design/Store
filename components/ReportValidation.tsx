import React, { useState } from 'react';
import { DailyReport, OrderSheet } from '../types';
import { CheckCircle, Clock, FileText, ChevronDown, ChevronUp, AlertCircle, ShoppingBag, Phone, User, Users } from 'lucide-react';

interface ReportValidationProps {
  reports: DailyReport[];
  orders: OrderSheet[];
  onValidateReport: (id: string) => void;
  onValidateOrder: (id: string) => void;
}

export const ReportValidation: React.FC<ReportValidationProps> = ({ reports, orders, onValidateReport, onValidateOrder }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingReports = reports.filter(r => r.status === 'PENDENTE');
  const pendingOrders = orders.filter(o => o.status === 'PENDENTE');
  const validatedReports = reports.filter(r => r.status === 'VALIDADO');
  const validatedOrders = orders.filter(o => o.status === 'ENTREGUE');

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><CheckCircle className="text-indigo-600" /> Validação Pastoral</h2>
      </div>

      {/* VENDAS */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Vendas do Dia ({pendingReports.length})</h3>
        {pendingReports.map(report => (
            <ReportCard key={report.id} report={report} isExpanded={expandedId === report.id} onToggle={() => toggleExpand(report.id)} onAction={() => onValidateReport(report.id)} />
        ))}
      </div>

      {/* ENCOMENDAS */}
      {pendingOrders.length > 0 && (
        <div className="mt-8">
            <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2">
                <ShoppingBag size={16} /> Encomendas Pagas ({pendingOrders.length})
            </h3>
            <div className="space-y-4">
                {pendingOrders.map(order => (
                    <OrderCard key={order.id} order={order} isExpanded={expandedId === order.id} onToggle={() => toggleExpand(order.id)} onAction={() => onValidateOrder(order.id)} />
                ))}
            </div>
        </div>
      )}

      {/* HISTÓRICO... (Código igual ao anterior, omitido para brevidade) */}
    </div>
  );
};

// ... ReportCard igual ao anterior ...

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
                <div className="border-t border-slate-100 bg-indigo-50/30 p-4">
                     {/* Resumo Financeiro da Encomenda */}
                     <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="bg-white p-2 rounded border border-indigo-100 text-center"><p className="text-[10px] text-slate-400">Dinheiro</p><p className="font-bold text-slate-700">R$ {order.totalCash.toFixed(2)}</p></div>
                        <div className="bg-white p-2 rounded border border-indigo-100 text-center"><p className="text-[10px] text-slate-400">Pix</p><p className="font-bold text-slate-700">R$ {order.totalPix.toFixed(2)}</p></div>
                        <div className="bg-white p-2 rounded border border-indigo-100 text-center"><p className="text-[10px] text-slate-400">Débito</p><p className="font-bold text-slate-700">R$ {order.totalDebit.toFixed(2)}</p></div>
                        <div className="bg-white p-2 rounded border border-indigo-100 text-center"><p className="text-[10px] text-slate-400">Crédito</p><p className="font-bold text-slate-700">R$ {order.totalCredit.toFixed(2)}</p></div>
                     </div>

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
                    <button onClick={onAction} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2">
                        <CheckCircle size={18}/> Validar Recebimento das Encomendas
                    </button>
                </div>
            )}
        </div>
    );
}

const ReportCard = ({ report, isExpanded, onToggle, onAction }: any) => {
     // ... (Mesmo código do ReportCard anterior)
     return <div className="bg-white p-4 border rounded shadow-sm mb-2" onClick={onToggle}>
         <div className="flex justify-between font-bold"><span>{report.serviceType}</span><span>R$ {report.grandTotal.toFixed(2)}</span></div>
         {isExpanded && (
             <div className="mt-2 pt-2 border-t">
                 {/* Mini tabela simplificada */}
                 {report.items.map((i:any,idx:number) => <div key={idx} className="flex justify-between text-xs py-1"><span>{i.quantity}x {i.productName} ({i.paymentMethod})</span><span>{i.total.toFixed(2)}</span></div>)}
                 <button onClick={onAction} className="w-full mt-2 bg-emerald-600 text-white py-2 rounded">Validar</button>
             </div>
         )}
     </div>
}
